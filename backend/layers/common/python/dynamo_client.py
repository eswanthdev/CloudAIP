import os
import boto3
from boto3.dynamodb.conditions import Key, Attr

# Table name constants from environment
MAIN_TABLE = os.environ.get('MAIN_TABLE', 'CloudAIP-Main-staging')
ACTIVITY_TABLE = os.environ.get('ACTIVITY_TABLE', 'CloudAIP-Activity-staging')
LEADS_TABLE = os.environ.get('LEADS_TABLE', 'CloudAIP-Leads-staging')

# DynamoDB resource (reused across invocations)
dynamodb = boto3.resource('dynamodb')

def get_main_table():
    return dynamodb.Table(MAIN_TABLE)

def get_activity_table():
    return dynamodb.Table(ACTIVITY_TABLE)

def get_leads_table():
    return dynamodb.Table(LEADS_TABLE)
