export type MethodStatus = "in-development" | "planned" | "under-evaluation";

export interface MethodDefinition {
  slug: string;
  name: string;
  status: MethodStatus;
  statusLabel: string;
  summary: string;
  role: string;
  source: string;
  sourceUrl: string;
  implementationNote: string;
  scope: string[];
}

export const methods: MethodDefinition[] = [
  {
    slug: "dpc-v1",
    name: "DPC Carbon Footprint Toolkit v1.0",
    status: "in-development",
    statusLabel: "Under development · not validated",
    summary: "A method for estimating the carbon footprint associated with digital preservation activities.",
    role: "The first calculation engine planned for DCFP. Its implementation will be based on the published DPC toolkit, with source attribution and documented interpretation.",
    source: "Digital Preservation Coalition. (2026). Carbon Footprint Toolkit.",
    sourceUrl: "https://doi.org/10.7207/carbonfootprinttoolkit26-01",
    implementationNote: "An early TypeScript calculation engine and initial tests exist. It is not yet validated against Excel-calculated outputs and must not be used for production or formal reporting.",
    scope: ["Digital preservation activities", "Activity data and energy-related estimates", "Transparent assumptions and source references"],
  },
  {
    slug: "sci",
    name: "Software Carbon Intensity (SCI)",
    status: "planned",
    statusLabel: "Research roadmap",
    summary: "A software-focused carbon-intensity approach with a defined functional unit.",
    role: "A potential independent engine for assessing software-related carbon intensity. It will require its own input model and method-specific result interpretation.",
    source: "ISO/IEC 21031 — Software Carbon Intensity (SCI) specification.",
    sourceUrl: "https://www.iso.org/standard/86612.html",
    implementationNote: "Not implemented. The standard's requirements, licensing/access conditions, and suitable application scope must be reviewed before development.",
    scope: ["Software systems and services", "Functional-unit definition", "Operational and embodied emissions where required by the method"],
  },
  {
    slug: "ghg-protocol",
    name: "GHG Protocol",
    status: "under-evaluation",
    statusLabel: "Framework evaluation",
    summary: "A widely used framework for organizational greenhouse-gas accounting and reporting.",
    role: "Potential alignment for organizational boundaries, emissions scopes, and reporting. It is not treated as one universal calculation formula or a standalone DCFP engine.",
    source: "GHG Protocol — Standards and Guidance.",
    sourceUrl: "https://ghgprotocol.org/standards-guidance",
    implementationNote: "No standalone engine is planned until a specific accounting use case and the applicable standards are identified.",
    scope: ["Organizational and operational accounting", "Emissions categorization and reporting", "Boundary and disclosure alignment"],
  },
  {
    slug: "itu-l1410",
    name: "ITU-T L.1410 / Life-cycle assessment",
    status: "planned",
    statusLabel: "Research roadmap",
    summary: "A life-cycle assessment approach for ICT goods, networks, and services.",
    role: "A possible separate assessment pathway for ICT life-cycle impacts. It requires a distinct life-cycle data model and assessment boundary.",
    source: "ITU-T Recommendation L.1410.",
    sourceUrl: "https://www.itu.int/rec/T-REC-L.1410",
    implementationNote: "Not implemented. Applicability, required datasets, allocation rules, and access to the normative recommendation must be assessed first.",
    scope: ["ICT goods and services", "Life-cycle stages and system boundaries", "Life-cycle inventory and impact assessment data"],
  },
];
