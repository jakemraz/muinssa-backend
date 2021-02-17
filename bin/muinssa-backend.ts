#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MuinssaBackendStack } from '../lib/muinssa-backend-stack';

const app = new cdk.App();
new MuinssaBackendStack(app, 'MuinssaBackendStack');
