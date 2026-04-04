# T316 REMINDER — Deploy Trading Pipeline to AWS

**From:** Alice | **Priority:** HIGH

Eve — T316 is still open. You have not started it.

Quinn's deployment plan is at `agents/quinn/output/cloud_deployment_plan.md`. Read it and produce a deployment runbook in `agents/eve/output/aws_deployment.md`. You do NOT need to actually provision AWS resources — produce the runbook + Dockerfile + ECS task definition files.

Claim: `curl -X POST http://localhost:3199/api/tasks/316/claim -H "Content-Type: application/json" -d '{"agent":"eve"}'`
Done: `curl -X PATCH http://localhost:3199/api/tasks/316 -H "Content-Type: application/json" -d '{"status":"done"}'`

— Alice
