import { ARCHIVE_PROJECTS } from "../content.js";

export const PROJECT_CATEGORIES = [
  { id: "robotics", title: "Robotics & Automation" },
  { id: "aerospace", title: "UAV & Aerospace" },
  { id: "embedded", title: "IoT, Electronics & Embedded Systems" },
  { id: "intelligent", title: "Artificial Intelligence & Intelligent Systems" },
];

// Factual scope: the society's supplied 17-project catalogue. Older records are
// retained as editorial provenance, not silently promoted to verified hardware
// specifications. No available photograph is securely associated with a named
// catalogue project; event photographs remain in their original records.
const entries = [
  {
    id: "self-balancing-robot", title: "Self-Balancing Robot", category: "robotics", legacyTitle: "Self-Balancing Robot",
    description: "A two-wheeled robotic platform that uses real-time sensor feedback and motor control to maintain dynamic balance, exploring the relationship between sensing, movement and stability.",
    introduction: "A two-wheeled robotic platform using real-time sensor feedback and motor control to maintain dynamic balance.",
    overview: "Staying upright on two wheels is an active control problem rather than a purely mechanical one. This project explores how a robot can respond to a changing orientation, connecting an observable physical movement with decisions made by an electronic control system.",
    workingPrinciple: "In a balancing system, feedback describes the difference between a desired upright position and the current motion. Corrective wheel movement can reduce that difference. The timing and size of corrections matter because a response that arrives too late can amplify a disturbance.",
    technicalExploration: "The supplied description documents real-time feedback and motor control. Relevant concepts include dynamic stability, measurement uncertainty, response delay and the interaction between a moving body and its drive system. A specific controller, sensor model or tuning method is not established by that description.",
    potentialApplications: "Potential uses include teaching feedback control and exploring compact mobile platforms. Balancing capability alone does not establish suitability for carrying people or operating in public spaces.",
    takeaway: "Students can connect control theory to physical behaviour, learning why mechanical design, timely measurements and measured corrections must be considered together.",
  },
  {
    id: "all-terrain-sand-robot", title: "All-Terrain Sand Robot", category: "robotics", legacyTitle: "All-Terrain Sand Robot",
    description: "A robotic vehicle designed to move across sand and uneven terrain, exploring how mechanical design and motion control influence mobility on challenging surfaces and changing ground.",
    introduction: "A robotic vehicle designed for mobility across sandy, uneven, and challenging terrain.",
    overview: "Loose ground makes movement difficult because the surface can shift beneath a vehicle. This project explores robotic mobility where traction and stability cannot be taken for granted, making terrain interaction a central part of the engineering problem.",
    workingPrinciple: "In general, a ground vehicle moves by transferring force through its contact with a surface. On sand, slipping and sinking can consume energy without producing useful travel. Load distribution, contact geometry and controlled changes in motion influence that interaction.",
    technicalExploration: "The documented focus is travel over sandy and uneven ground. Mechanical design, ground contact, weight distribution and vehicle control are relevant areas of exploration. The current catalogue does not specify a drive arrangement, power source or navigation method, and it provides no terrain-test results.",
    potentialApplications: "Potential uses include terrain-mobility demonstrations and student exploration of remote ground inspection. Suitability for a particular outdoor task would depend on conditions and documented testing.",
    takeaway: "The project encourages students to evaluate the ground as part of a robotic system, rather than treating movement as a motor-selection problem alone.",
  },
  {
    id: "advanced-line-follower-robot", title: "Advanced Line Follower Robot", category: "robotics", legacyTitle: "Line Follower",
    description: "A sensor-guided autonomous robot for accurate line tracking and responsive motion control, exploring how continuous observations can guide movement along a defined path without manual steering.",
    introduction: "A sensor-guided autonomous robot developed for accurate line tracking and responsive motion control.",
    overview: "Following a marked path turns a visual or physical reference into a navigation problem. This robot explores how a moving platform can keep its position relative to a line while responding to changes in the path ahead.",
    workingPrinciple: "A line-following system generally observes where a reference line sits relative to the vehicle and adjusts its movement to reduce deviation. The quality of those observations and the timing of corrections influence whether the robot tracks smoothly or repeatedly overshoots.",
    technicalExploration: "Sensor-guided tracking and responsive motion control are documented goals. Relevant concepts include path error, calibration, feedback and the trade-off between movement speed and correction time. The supplied description does not identify a sensor type, control algorithm or measured tracking performance.",
    potentialApplications: "Potential applications include guided-route demonstrations and introductory autonomous-navigation exercises. A teaching track is a controlled environment; it does not establish readiness for industrial material handling.",
    takeaway: "Students can explore how sensing, mechanical alignment and control decisions interact, and why a consistent observation can be more useful than an unnecessarily aggressive correction.",
  },
  {
    id: "bionic-prosthetic-arm", title: "Bionic Prosthetic Arm", category: "robotics", legacyTitle: "Bionic Prosthetic Arm",
    description: "An electronically controlled prosthetic prototype exploring robotic movement and assistive technology, with a focus on how engineered motion can represent aspects of an arm’s movement.",
    introduction: "An electronically controlled prosthetic prototype exploring robotic movement and assistive technology.",
    overview: "Replicating aspects of arm movement brings mechanical design into contact with human needs. This prototype explores electronically controlled motion in an assistive-technology context. It should be understood as an engineering prototype, without any implied clinical validation or readiness for personal use.",
    workingPrinciple: "In a powered mechanism, electronic commands produce movement through an actuation system. Joint arrangement and mechanical limits shape the motions that can be represented. Translating an intended action into a controlled physical response also requires attention to predictable movement and safe boundaries.",
    technicalExploration: "The catalogue establishes electronic control and prosthetic prototyping. Relevant disciplines include robotics, mechanism design, human-machine interaction and assistive engineering. It does not establish a biological-signal interface, actuator model, force-feedback system or tested range of movement; those details require implementation documentation.",
    potentialApplications: "Potential uses include assistive-technology education and demonstrations of coordinated robotic movement. Any use involving a person would require a separate assessment of fit, reliability and safety.",
    takeaway: "Students can learn to connect mechanism design with usability, while recognising that a moving prototype and a validated assistive device represent different engineering responsibilities.",
  },
  {
    id: "fire-detection-suppression-rover", title: "Autonomous Fire Detection and Suppression Rover", category: "robotics", legacyTitle: null,
    description: "A robotic rover designed to detect potential fire sources and demonstrate automated suppression, bringing mobile robotics and responsive action together in a safety-oriented engineering exploration.",
    introduction: "A robotic rover designed to detect potential fire sources and demonstrate automated fire suppression.",
    overview: "Responding to a possible fire involves finding a relevant signal and deciding what action should follow. This rover explores that sequence on a mobile platform. Its stated purpose is a suppression demonstration, not a claim of certified firefighting capability.",
    workingPrinciple: "Conceptually, a detection-and-response system observes its surroundings, interprets a possible hazard and triggers an action. Mobility adds the problem of relating the detected source to the platform’s position. Reliable operation would require distinguishing meaningful signals from misleading environmental conditions.",
    technicalExploration: "Detection of potential fire sources and automated suppression are the documented functions being explored. Relevant concepts include mobile-system coordination, sensing uncertainty, decision thresholds and fail-safe behaviour. The supplied catalogue does not identify a detection technology, extinguishing medium or demonstrated operating conditions.",
    potentialApplications: "Potential uses include supervised robotics demonstrations and study of automated hazard response. The prototype description does not support use in an active emergency or replacement of established fire-safety equipment.",
    takeaway: "Students can examine how a complete response chain depends on every stage, and why a safety-oriented demonstration needs explicit limits as well as working motion.",
  },
  {
    id: "autonomous-surveillance-drone", title: "Autonomous Surveillance Drone", category: "aerospace", legacyTitle: "Surveillance Drone",
    description: "An unmanned aerial platform designed for remote observation and aerial monitoring, exploring how an elevated viewpoint can support awareness across an area without a ground-based observer.",
    introduction: "An unmanned aerial platform designed for remote observation and aerial monitoring.",
    overview: "An aerial viewpoint can reveal spatial relationships that are difficult to observe from the ground. This project explores an unmanned platform for observation and monitoring. The catalogue title identifies an autonomous focus but does not document a particular autonomous mission or navigation capability.",
    workingPrinciple: "In general, aerial observation combines a flight platform with a means of collecting information about its surroundings. Keeping that information useful involves relating observations to position and time while maintaining controlled flight. Autonomy concerns which decisions a system can make within defined limits.",
    technicalExploration: "Remote observation and aerial monitoring are the supplied functional scope. Flight stability, observation planning, information interpretation and operational boundaries are relevant concepts. No imaging hardware, communications link, onboard software or flight-performance figures are verified in the current catalogue.",
    potentialApplications: "Potential uses include supervised site observation and aerial-inspection studies. Any monitoring activity would need an appropriate operating environment, permissions and consideration of the privacy of people nearby.",
    takeaway: "Students can explore the relationship between a useful observation and the flight decisions needed to obtain it, while defining autonomy in terms of documented functions.",
  },
  {
    id: "rc-fixed-wing-aircraft", title: "RC Fixed-Wing Aircraft", category: "aerospace", legacyTitle: "RC Fixed-Wing Aircraft",
    description: "A remotely controlled aircraft demonstrating aerodynamics, propulsion and flight control, exploring how the balance of forces and pilot inputs influences controlled movement through the air.",
    introduction: "A remotely controlled aircraft demonstrating aerodynamics, propulsion, and flight control.",
    overview: "A fixed-wing aircraft depends on coordinated design choices to turn propulsion and airflow into controlled flight. This project brings aerodynamics, structural arrangement and remote control into one platform, giving students a way to connect flight concepts with a physical aircraft.",
    workingPrinciple: "A wing moving through air can produce lift, while propulsion helps sustain forward motion. Aircraft attitude changes alter how forces act on the airframe. In a remotely controlled platform, pilot commands influence those movements through the aircraft’s control system.",
    technicalExploration: "The documented focus covers aerodynamics, propulsion and flight control. Relevant questions include balance, stability, control response and structural loading. The catalogue does not establish a particular airframe material, propulsion arrangement, communications system or flight envelope, and no range or endurance is published.",
    potentialApplications: "Potential uses include supervised model-aviation learning and demonstrations of flight mechanics. Training and a suitable operating area would be necessary before any flight activity; the description alone does not establish operational readiness.",
    takeaway: "Students can learn why aircraft design requires a system-level view: changing mass distribution, geometry or propulsion can change the behaviour of the whole platform.",
  },
  {
    id: "agriculture-monitoring-drone", title: "Agriculture Monitoring Drone", category: "aerospace", legacyTitle: "Agriculture Monitoring Drone",
    description: "A UAV-based system developed for agricultural inspection and crop observation, exploring how aerial perspectives can help people examine field conditions and identify areas needing closer attention.",
    introduction: "A UAV-based system developed for aerial agricultural inspection and crop observation.",
    overview: "Field conditions can vary over an area that is difficult to inspect from a single ground position. This project explores aerial observation as a way to support agricultural inspection. Its documented purpose is monitoring; a crop-treatment or spraying capability is not established here.",
    workingPrinciple: "An aerial inspection system generally gathers observations from above and relates them to the area being examined. Repeated viewpoints can help an observer notice differences across a field, but interpreting those differences requires context about the crop and its growing conditions.",
    technicalExploration: "The supplied catalogue documents UAV-based crop observation. Flight planning, coverage, observation consistency and the relationship between aerial evidence and ground conditions are relevant engineering concepts. The current record does not verify a camera type, sensor package, analytical method or agricultural performance result.",
    potentialApplications: "Potential uses include field-inspection studies and helping an observer decide where to investigate on the ground. Aerial appearance alone should not be treated as a confirmed diagnosis of crop health.",
    takeaway: "Students can learn to frame a monitoring task around the information needed by its user, rather than assuming that collecting more aerial data automatically produces a useful agricultural decision.",
  },
  {
    id: "arduino-custom-flight-controller", title: "Arduino-Based Custom Drone Flight Controller", category: "aerospace", legacyTitle: null,
    description: "A custom Arduino-based embedded flight controller exploring drone stabilization, sensor integration and flight-control algorithms, connecting measurements and control decisions within the electronics of an aerial platform.",
    introduction: "A custom embedded flight controller exploring drone stabilization, sensor integration, and flight-control algorithms.",
    overview: "A flight controller links changing measurements to decisions about an aircraft’s movement. This project explores that embedded-control role through a custom Arduino-based controller. It focuses attention on the electronics and software that help coordinate a drone rather than on the airframe alone.",
    workingPrinciple: "Conceptually, a controller reads information about motion, compares it with a desired condition and calculates corrective commands. These operations repeat as the aircraft moves. Measurement quality and predictable timing both influence how well a feedback loop can respond to disturbances.",
    technicalExploration: "Arduino is established by the supplied project title; stabilization, sensor integration and flight-control algorithms are the documented exploration areas. Relevant concepts include embedded timing, feedback, signal interpretation and integration. No board model, sensor component, named algorithm or successful flight test is specified.",
    potentialApplications: "Potential uses include embedded-control education and supervised development of experimental flight-control concepts. A controller prototype would require systematic validation before it could be considered suitable for an aircraft in operation.",
    takeaway: "Students can examine the difference between running a calculation and running it reliably at the right time, an important distinction when software interacts with a moving physical system.",
    verifiedTechnologies: ["Arduino — platform named in the supplied catalogue; board model unspecified"],
  },
  {
    id: "uav-medical-organ-transportation", title: "UAV-Based Medical Organ Transportation System", category: "aerospace", legacyTitle: null,
    description: "A drone-based medical logistics prototype exploring transport of time-sensitive medical cargo, connecting aerial mobility with the planning and handling questions raised by an organ-transportation concept.",
    introduction: "A drone-based medical logistics prototype exploring transportation of time-sensitive medical cargo.",
    overview: "Medical logistics raises questions about time, handling and dependable delivery. This project explores a drone-based organ-transportation concept as a prototype. The supplied description does not establish transport of an actual organ, a clinical partnership or approval for medical use.",
    workingPrinciple: "In general, an aerial logistics system combines a vehicle, a cargo-handling arrangement and a planned movement between locations. For time-sensitive medical cargo, the journey is only one part of a larger chain that includes preparation, transfer and receiving procedures.",
    technicalExploration: "The documented scope is a medical-cargo transportation prototype. Relevant disciplines include aerial mobility, logistics, system reliability and handling requirements. Payload capacity, environmental control, route planning, communication methods and transport-test outcomes are not verified by the current catalogue and are not presented as implemented features.",
    potentialApplications: "Potential uses include logistics modelling and supervised demonstrations with non-clinical test cargo. Actual medical transport would require appropriate clinical, operational and regulatory validation beyond the described prototype.",
    takeaway: "Students can learn that a transportation system must be evaluated across its whole delivery chain, and that an engineering demonstration does not establish clinical suitability.",
  },
  {
    id: "uav-crop-anomaly-detection", title: "Autonomous UAV-Based Crop Anomaly Detection System", category: "aerospace", legacyTitle: null,
    description: "An autonomous aerial platform designed to observe fields and identify potential crop abnormalities, exploring how aerial monitoring and analysis can direct attention to unusual field conditions.",
    introduction: "An autonomous aerial platform designed to monitor fields and identify potential crop abnormalities through aerial observation and analysis.",
    overview: "An unusual patch in a field can be a useful starting point for investigation without explaining its cause. This project explores a UAV-based approach to finding such potential abnormalities, connecting aerial observation with analysis intended to help prioritise further inspection.",
    workingPrinciple: "Conceptually, anomaly detection compares observations with an expected pattern and highlights differences worth examining. Aerial monitoring adds the need for useful coverage and consistent observations. A flagged difference may reflect growing conditions, an observation artefact or another cause that needs ground-level context.",
    technicalExploration: "The catalogue establishes autonomous aerial monitoring and potential-anomaly identification as the project’s focus. Relevant concepts include observation consistency, spatial variation, analytical uncertainty and the relationship between a flag and a diagnosis. No dataset, learning model, imaging system or detection accuracy is documented.",
    potentialApplications: "Potential uses include identifying field areas for closer agricultural inspection and studying workflows that combine aerial evidence with human assessment. The description does not establish automated disease diagnosis or treatment recommendations.",
    takeaway: "Students can explore how useful analysis communicates uncertainty, and why detecting a difference is a distinct engineering task from explaining the biological reason behind it.",
  },
  {
    id: "alcohol-detection-system", title: "Alcohol Detection System", category: "embedded", legacyTitle: "Alcohol Detection Ignition Lock",
    description: "A sensor-based electronic system designed to detect alcohol presence for safety-oriented applications, exploring how a physical measurement can be interpreted and communicated through an electronic response.",
    introduction: "A sensor-based electronic system designed to detect alcohol presence for safety-oriented applications.",
    overview: "Detecting the presence of a substance requires more than observing a changing signal. This project explores alcohol detection through an electronic system, connecting sensing with interpretation in a safety-oriented context. The supplied description does not establish a certified measurement or enforcement device.",
    workingPrinciple: "A sensing system generally converts a physical interaction into an electrical response that can be interpreted. Calibration and environmental influences affect the meaning of that response. Detecting presence is also different from accurately measuring a concentration under a validated procedure.",
    technicalExploration: "The documented function is sensor-based alcohol detection. Relevant concepts include measurement uncertainty, calibration, threshold selection and clear indication. A sensor model, processor, ignition interlock, communications feature or verified measurement range is not established by the current catalogue description.",
    potentialApplications: "Potential uses include electronics demonstrations and learning about sensing in safety-related systems. A prototype indication should not be treated as a medical, legal or vehicle-safety determination without appropriate validation.",
    takeaway: "Students can learn to distinguish a detectable signal from a defensible conclusion, and to describe the conditions under which an electronic indication can be interpreted responsibly.",
  },
  {
    id: "smart-helmet-system", title: "Smart Helmet System", category: "embedded", legacyTitle: "Smart Helmet",
    description: "An intelligent helmet prototype exploring embedded sensing and wearable safety technology, bringing electronic functions into a familiar protective object while considering comfort, usability and meaningful feedback.",
    introduction: "An intelligent helmet prototype exploring embedded sensing and wearable safety technology.",
    overview: "A wearable device must work with a person’s routine rather than simply house electronics. This helmet prototype explores embedded sensing in a safety-technology context. Adding electronic functions does not itself demonstrate that the helmet meets a protective-equipment standard or improves protection.",
    workingPrinciple: "In a sensing-enabled wearable, measurements are collected close to the user and interpreted to support a defined function. Placement, movement and the surrounding environment can influence those measurements. Feedback must also be understandable without creating unnecessary distraction or interfering with normal use.",
    technicalExploration: "The supplied record establishes a helmet prototype with an embedded-sensing focus. Relevant concepts include wearable integration, ergonomics, power requirements and reliable interpretation. Specific sensors, location tracking, accident-detection logic and emergency messaging are not verified in the supplied description.",
    potentialApplications: "Potential uses include wearable-electronics education and exploration of contextual safety information. Any protective or emergency-response use would require separate validation of both the helmet and the electronic system.",
    takeaway: "Students can learn to treat human factors and physical integration as core engineering questions, while separating a useful prototype feature from a proven safety benefit.",
  },
  {
    id: "wireless-power-transfer-system", title: "Wireless Power Transfer System", category: "embedded", legacyTitle: "Wireless Power Transfer",
    description: "An experimental system demonstrating contactless electrical energy transfer through electromagnetic coupling, exploring how energy can move between separated parts without a direct conductive connection between them.",
    introduction: "An experimental system demonstrating contactless electrical energy transfer through electromagnetic coupling.",
    overview: "Transferring electrical energy without a direct connection makes the space between two parts an important design consideration. This experimental system explores electromagnetic coupling, offering a way to study energy transfer through interacting fields rather than through a continuous conducting path.",
    workingPrinciple: "A changing electromagnetic field can couple energy from a transmitting arrangement to a receiving one. The relationship between the two arrangements affects how much energy can be transferred. Their position and surrounding conditions can change that relationship, making alignment an important conceptual consideration.",
    technicalExploration: "Contactless transfer through electromagnetic coupling is the documented principle. Relevant concepts include field interaction, electrical conversion, alignment and energy losses. The catalogue does not identify a circuit topology, operating frequency, transfer distance, delivered power or measured efficiency, so none is asserted for this build.",
    potentialApplications: "Potential uses include demonstrations of coupling and exploration of contactless charging concepts. Compatibility with an actual device or charging standard would need implementation details and electrical validation.",
    takeaway: "Students can connect electromagnetic theory to an observable energy-transfer process, learning why the behaviour of a complete arrangement matters more than the transmitter or receiver in isolation.",
  },
  {
    id: "hydroponic-plant-monitoring-system", title: "Hydroponic Plant Monitoring System", category: "embedded", legacyTitle: "Hydroponic Plant Monitor",
    description: "An electronic monitoring system designed to observe important parameters in hydroponic cultivation, exploring how measurements can support understanding of a growing environment without implying automated crop management.",
    introduction: "An electronic monitoring system designed to observe important parameters in hydroponic cultivation.",
    overview: "Hydroponic cultivation depends on a managed growing environment, so useful measurements can help people understand changing conditions. This project explores electronic monitoring in that setting. The supplied catalogue does not establish automatic nutrient dosing, remote connectivity or a particular set of measured parameters.",
    workingPrinciple: "A monitoring system generally gathers measurements from a physical environment and makes them available for interpretation. For cultivation, a reading is most useful when its location, timing and meaning are understood. Observing a condition does not by itself establish how it should be corrected.",
    technicalExploration: "The documented functionality is observation of important cultivation parameters. Relevant concepts include measurement selection, calibration, environmental variation and clear presentation. Specific probes, processors, communication protocols and control actions remain undocumented; no claim is made about crop yield or growing performance.",
    potentialApplications: "Potential uses include cultivation-monitoring demonstrations and learning how electronic observations can support a grower’s decisions. Any operational recommendations would require knowledge of the plants, growing method and measurement reliability.",
    takeaway: "Students can learn to choose measurements for a real information need, and to distinguish a monitoring system from an automated control system or an agricultural recommendation service.",
  },
  {
    id: "anti-sleep-monitoring-system", title: "Anti-Sleep Monitoring System", category: "intelligent", legacyTitle: "Anti-Sleep Monitor",
    description: "An intelligent monitoring system intended to detect potential drowsiness and support fatigue awareness, exploring how observed cues might inform a timely indication without establishing a medical diagnosis.",
    introduction: "An intelligent monitoring system intended to detect potential drowsiness and support fatigue-awareness applications.",
    overview: "Fatigue can affect attention, but it is not directly established by a single observable cue. This project explores monitoring intended to identify potential drowsiness and support awareness. It should not be understood as a validated medical assessment or a guarantee of safe activity.",
    workingPrinciple: "Conceptually, a monitoring system observes relevant signals, looks for patterns associated with a condition and produces an indication. Those patterns can vary between people and environments. A useful system must consider both missed indications and indications triggered when the condition is not present.",
    technicalExploration: "Potential-drowsiness detection and fatigue awareness are the documented aims. Relevant concepts include pattern interpretation, uncertainty, individual variation and the design of understandable feedback. The current description does not verify a camera, biological sensor, named algorithm, dataset or measured detection performance.",
    potentialApplications: "Potential uses include human-machine interaction studies and supervised fatigue-awareness demonstrations. The prototype should not replace rest, medical assessment or established safety procedures in driving or other demanding activities.",
    takeaway: "Students can examine how an intelligent system should communicate a tentative inference, learning that an alert needs an honest account of uncertainty as well as a technical trigger.",
  },
  {
    id: "interactive-ai-desk-companion", title: "Interactive AI Desk Companion Chatbot", category: "intelligent", legacyTitle: null,
    description: "A compact interactive desk companion exploring conversational AI and human-computer interaction, considering how dialogue and a physical setting can shape a useful, understandable interaction with technology.",
    introduction: "A compact interactive desk companion exploring conversational AI and human-computer interaction.",
    overview: "Placing a conversational interface on a desk changes how people encounter and use it. This project explores an interactive companion where dialogue and physical context meet, making the quality of the interaction an engineering question alongside the behaviour of the conversational system.",
    workingPrinciple: "A conversational system generally receives an input, interprets its context and produces a response that a person can understand. The interaction also needs clear turn-taking and a way to handle uncertainty or misunderstanding. A physical companion adds questions about how availability and feedback are communicated.",
    technicalExploration: "The catalogue establishes a compact desk-companion chatbot and an interest in conversational AI. Relevant concepts include dialogue design, response relevance, interaction feedback and privacy. It does not document a language model, software framework, microphone, display or other hardware arrangement, and none is implied here.",
    potentialApplications: "Potential uses include demonstrations of conversational interaction and exploration of desk-based interfaces. Particular assistant functions, independent decision-making capabilities or access to personal information are not established by the current record.",
    takeaway: "Students can learn to evaluate a conversational prototype through the user’s experience, asking whether the system communicates its capabilities and limits as clearly as it communicates a response.",
  },
];

export const PROJECT_CATALOGUE = entries.map(p => ({
  ...p,
  categoryTitle: PROJECT_CATEGORIES.find(c => c.id === p.category).title,
  coverImage: null, gallery: [], team: null, year: null, status: null,
  verifiedTechnologies: p.verifiedTechnologies || [], references: [],
  legacyRecord: p.legacyTitle ? ARCHIVE_PROJECTS.find(old => old.title === p.legacyTitle) || null : null,
}));

export function categoryCounts(projects = PROJECT_CATALOGUE) {
  return Object.fromEntries([ ["all", projects.length], ...PROJECT_CATEGORIES.map(c => [c.id, projects.filter(p => p.category === c.id).length]) ]);
}
export function filterProjects(category = "all", query = "", projects = PROJECT_CATALOGUE) {
  const search = query.trim().toLocaleLowerCase();
  return projects.filter(p => (category === "all" || p.category === category) && `${p.title} ${p.categoryTitle} ${p.description}`.toLocaleLowerCase().includes(search));
}
export function imageIndex(index, direction, length) { return length ? (index + direction + length) % length : 0; }
export function imageZoom(value) { return Math.max(1, Math.min(3, value)); }
export function projectImages(project) {
  const images = (project.gallery || []).filter(image => image?.src);
  const combined = project.coverImage?.src && !images.some(image => image.src === project.coverImage.src) ? [project.coverImage, ...images] : images;
  return combined.filter((image, index) => combined.findIndex(candidate => candidate.src === image.src) === index);
}
