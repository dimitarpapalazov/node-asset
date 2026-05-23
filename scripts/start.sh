#!/bin/bash
export $(grep -v '^#' .env | xargs)
node dist/index.js