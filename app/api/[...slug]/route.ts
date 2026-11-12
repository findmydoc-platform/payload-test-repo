import { REST_GET, REST_POST, REST_PATCH } from "@payloadcms/next/routes";
import config from "../../../src/config";

export const GET = REST_GET(config);
export const POST = REST_POST(config);
export const PATCH = REST_PATCH(config);
