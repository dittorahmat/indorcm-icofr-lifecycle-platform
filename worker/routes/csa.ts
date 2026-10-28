import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { csaSchedulesRoute } from './csa/csa-schedules';
import { csaRecordsRoute } from './csa/csa-records';
import { csaWorklistRoute } from './csa/csa-worklist';
import { csaSamplesTestingRoute } from './csa/csa-samples-testing';

const csa = new Hono<HonoEnv>();

csa.route('/', csaSchedulesRoute);
csa.route('/', csaWorklistRoute);
csa.route('/', csaRecordsRoute);
csa.route('/', csaSamplesTestingRoute);

export default csa;
