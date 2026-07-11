import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const statements = {
  ...defaultStatements,
  diseaseCase: ["create", "view", "update", "validate", "delete"],
  environmentalData: ["create", "view", "update", "validate", "delete"],
  prediction: ["create", "view", "monitor"],
  report: ["create", "view", "export"],
  alert: ["view", "acknowledge", "resolve"],
  setting: ["view", "update"],
} as const;

export const ac = createAccessControl(statements);

export const healthOfficer = ac.newRole({
  diseaseCase: ["create", "view", "update", "validate"],
  environmentalData: ["create", "view", "update", "validate"],
  prediction: ["create", "view"],
  report: ["create", "view", "export"],
  alert: ["view", "acknowledge"],
  setting: ["view"],
});

export const governmentOfficial = ac.newRole({
  diseaseCase: ["view"],
  environmentalData: ["view"],
  prediction: ["view", "monitor"],
  report: ["create", "view", "export"],
  alert: ["view", "acknowledge"],
  setting: ["view"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  diseaseCase: ["create", "view", "update", "validate", "delete"],
  environmentalData: ["create", "view", "update", "validate", "delete"],
  prediction: ["create", "view", "monitor"],
  report: ["create", "view", "export"],
  alert: ["view", "acknowledge", "resolve"],
  setting: ["view", "update"],
});
