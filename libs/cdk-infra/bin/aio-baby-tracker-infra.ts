#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AioBabyTrackerStack } from '../lib/aio-baby-tracker-stack';

const app = new cdk.App();
new AioBabyTrackerStack(app, 'AioBabyTrackerStack', {});
