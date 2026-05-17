#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DevsaathiStack } from '../lib/devsaathi-stack';

const app = new cdk.App();
new DevsaathiStack(app, 'DevsaathiStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'ap-south-1' 
  },
});
