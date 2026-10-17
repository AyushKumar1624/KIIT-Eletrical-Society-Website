import "server-only";
import { COLLECTIONS } from "../backend/mongo.mjs";
import { recordAuditLog } from "../admin/server/audit.mjs";
import {
  SOCIETY, ABOUT, DOMAINS, PROJECTS, ARCHIVE_PROJECTS,
  EVENTS, TEAM, MENTORS, FOUNDING_FACULTY, GALLERY, CONTACT,
} from "../content.js";
import { PROJECT_CATALOGUE } from "../projects/catalogue.mjs";

export const CMS_TYPES = Object.freeze([
  "project",
  "achievement",
  "milestone",
  "event",
  "leadership",
  "faculty",
  "domain",
  "gallery",
]);

/**
 * Returns static fallback content for a specific type if database is empty/unseeded.
 */
export function getStaticFallback(type) {
  switch (type) {
    case "project":
      return (PROJECT_CATALOGUE || []).map((p, idx) => ({
        type: "project",
        slug: p.id,
        title: p.title,
        category: p.category,
        description: p.description,
        introduction: p.introduction,
        overview: p.overview,
        workingPrinciple: p.workingPrinciple,
        technicalExploration: p.technicalExploration,
        potentialApplications: p.potentialApplications,
        takeaway: p.takeaway,
        published: true,
        order: idx + 1,
      }));
    case "domain":
      return DOMAINS.map((d, idx) => ({
        type: "domain",
        slug: d.key,
        title: d.title,
        group: d.group,
        plate: d.plate,
        text: d.text,
        published: true,
        order: idx + 1,
      }));
    case "event":
      return EVENTS.map((e, idx) => ({
        type: "event",
        slug: e.id,
        title: e.name,
        date: e.date,
        dateTime: e.dateTime,
        kind: e.kind,
        summary: e.summary,
        place: e.place,
        image: e.image,
        details: e.details,
        published: true,
        order: idx + 1,
      }));
    case "leadership":
      return TEAM.map((m, idx) => ({
        type: "leadership",
        slug: m.name.toLowerCase().replace(/\s+/g, "-"),
        title: m.name,
        role: m.role,
        photo: m.photo,
        linkedin: m.linkedin || null,
        published: true,
        order: idx + 1,
      }));
    case "faculty":
      return [...MENTORS, ...FOUNDING_FACULTY].map((f, idx) => ({
        type: "faculty",
        slug: f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: f.name,
        role: f.role,
        department: f.title,
        photo: f.photo,
        url: f.url || null,
        published: true,
        order: idx + 1,
      }));
    case "gallery":
      return GALLERY.map((g, idx) => ({
        type: "gallery",
        slug: `gallery-${idx + 1}-${g.media}`,
        title: g.caption,
        media: g.media,
        meta: g.meta,
        span: g.span,
        published: true,
        order: idx + 1,
      }));
    case "achievement":
      return EVENTS.filter(e => e.kind?.toLowerCase().includes("achievement")).map((a, idx) => ({
        type: "achievement",
        slug: a.id,
        title: a.name,
        date: a.date,
        summary: a.summary,
        place: a.place,
        published: true,
        order: idx + 1,
      }));
    case "milestone":
      return [
        { type: "milestone", slug: "founded", title: "KES Founded", year: 2018, summary: "Society established at School of Electrical Engineering, KIIT", published: true, order: 1 },
        { type: "milestone", slug: "kk1", title: "Kreative Kontrol 1.0", year: 2024, summary: "Inaugural flagship workshop & competition", published: true, order: 2 },
        { type: "milestone", slug: "kk3", title: "Kreative Kontrol 3.0", year: 2026, summary: "Flagship event with Silver Wings Media Creation", published: true, order: 3 },
      ];
    default:
      return [];
  }
}

export function createCmsService({ db, now = () => new Date() }) {
  const cmsCol = db.collection(COLLECTIONS.cms);

  return {
    async listContent(type, { publishedOnly = false } = {}) {
      if (!CMS_TYPES.includes(type)) return { status: "invalid", items: [] };

      const totalCount = await cmsCol.countDocuments({ type });

      // Graceful fallback to static data ONLY if no DB records exist at all for this type
      if (totalCount === 0) {
        const fallback = getStaticFallback(type);
        const filtered = publishedOnly ? fallback.filter(i => i.published) : fallback;
        return { status: "ok", items: filtered, fallback: true };
      }

      const query = { type };
      if (publishedOnly) query.published = true;

      const items = await cmsCol.find(query).sort({ order: 1, updatedAt: -1 }).toArray();

      return {
        status: "ok",
        items: items.map(doc => {
          const { _id, ...rest } = doc;
          return { id: String(_id), ...rest };
        }),
        fallback: false,
      };
    },

    async getContent(type, slug, { publishedOnly = false } = {}) {
      if (!CMS_TYPES.includes(type) || !slug) return { status: "not-found" };

      const query = { type, slug };
      if (publishedOnly) query.published = true;

      const doc = await cmsCol.findOne(query);
      if (doc) {
        const { _id, ...rest } = doc;
        return { status: "ok", item: { id: String(_id), ...rest } };
      }

      // Check fallback
      const fallbackItem = getStaticFallback(type).find(i => i.slug === slug);
      if (fallbackItem && (!publishedOnly || fallbackItem.published)) {
        return { status: "ok", item: fallbackItem, fallback: true };
      }

      return { status: "not-found" };
    },

    async saveContent(type, slug, payload, actor = {}) {
      if (!CMS_TYPES.includes(type) || !slug) return { status: "invalid" };
      const t = now();

      const existing = await cmsCol.findOne({ type, slug });
      const doc = {
        type,
        slug,
        title: payload.title || existing?.title || slug,
        published: payload.published !== undefined ? Boolean(payload.published) : existing?.published ?? false,
        order: payload.order !== undefined ? Number(payload.order) : existing?.order ?? 0,
        data: payload.data || existing?.data || {},
        updatedAt: t,
        updatedBy: actor.email || actor.id || "admin",
      };

      const result = await cmsCol.findOneAndUpdate(
        { type, slug },
        { $set: doc },
        { upsert: true, returnDocument: "after", includeResultMetadata: false }
      );

      await recordAuditLog(db, {
        actorId: actor.id || "admin",
        actorEmail: actor.email,
        action: existing ? "cms_update" : "cms_create",
        entity: `cms_${type}`,
        entityId: slug,
        oldValue: existing,
        newValue: doc,
        timestamp: t,
      });

      const { _id, ...rest } = result;
      return { status: "saved", item: { id: String(_id), ...rest } };
    },

    async setPublishState(type, slug, published, actor = {}) {
      if (!CMS_TYPES.includes(type) || !slug) return { status: "invalid" };
      const t = now();

      const updated = await cmsCol.findOneAndUpdate(
        { type, slug },
        { $set: { published: Boolean(published), updatedAt: t, updatedBy: actor.email || actor.id || "admin" } },
        { returnDocument: "after", includeResultMetadata: false }
      );

      if (!updated) return { status: "not-found" };

      await recordAuditLog(db, {
        actorId: actor.id || "admin",
        actorEmail: actor.email,
        action: published ? "cms_publish" : "cms_unpublish",
        entity: `cms_${type}`,
        entityId: slug,
        newValue: { published: Boolean(published) },
        timestamp: t,
      });

      return { status: "ok", item: updated };
    },

    async deleteContent(type, slug, actor = {}) {
      if (!CMS_TYPES.includes(type) || !slug) return { status: "invalid" };
      const existing = await cmsCol.findOne({ type, slug });
      if (!existing) return { status: "not-found" };

      await cmsCol.deleteOne({ type, slug });

      await recordAuditLog(db, {
        actorId: actor.id || "admin",
        actorEmail: actor.email,
        action: "cms_delete",
        entity: `cms_${type}`,
        entityId: slug,
        oldValue: existing,
        timestamp: now(),
      });

      return { status: "deleted" };
    },
  };
}
