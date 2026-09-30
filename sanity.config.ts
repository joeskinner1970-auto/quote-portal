"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { automotivateSchemaTypes, ilesbusSchemaTypes } from "./sanity/schemaTypes";
import { automotivateStudioStructure, ilesbusStudioStructure } from "./sanity/structure";
import { BulkStockUploadTool } from "./sanity/tools/BulkStockUploadTool";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "fbym0q45";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig([
  {
    name: "automotivate",
    title: "Automotivate Website",
    projectId,
    dataset,
    basePath: "/admin/automotivate",
    plugins: [structureTool({ structure: automotivateStudioStructure }), visionTool()],
    tools: [
      {
        name: "bulk-stock-upload",
        title: "Bulk stock upload",
        component: BulkStockUploadTool,
      },
    ],
    schema: { types: automotivateSchemaTypes },
  },
  {
    name: "ilesbus-by-trek",
    title: "Ilesbus by Trek",
    projectId,
    dataset,
    basePath: "/admin/ilesbus",
    plugins: [structureTool({ structure: ilesbusStudioStructure }), visionTool()],
    schema: { types: ilesbusSchemaTypes },
  },
]);

