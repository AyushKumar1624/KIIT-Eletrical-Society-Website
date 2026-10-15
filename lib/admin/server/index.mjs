import "server-only";
import { adminConfig } from "../../backend/config.mjs";
import { collections } from "../../backend/mongo.mjs";
import { mailConfig } from "../../join/server/config.mjs";
import { createMailSender } from "../../join/server/mailer.mjs";
import { createAdminRepository } from "./repository.mjs";
import { createAdminBackend } from "./service.mjs";

export async function getAdminBackend() {
  const config = adminConfig(); if (!config) return null;
  const mail = mailConfig();
  const send = mail ? createMailSender(mail) : null;
  const sendRecovery = send ? ({ to, url, expiresIn }) => send({ to, subject: "KES administrator password recovery", text: `A password reset was requested for your KES administrator account.\n\nOpen this trusted link within ${Math.round(expiresIn / 60)} minutes:\n${url}\n\nIf you did not request this, ignore this email. Your password has not changed.\nKES will never ask you to reply with your password.\n\nBuild small, think big.\nKIIT Electrical Society` }) : null;
  return createAdminBackend({ repository: createAdminRepository(await collections()), config, sendRecovery });
}
