import { settingsSectionRegistry } from "./SettingsSectionRegistry";
import { SecuritySettingsSection } from "./SecuritySettingsSection";
import { PrivacySettingsSection } from "./PrivacySettingsSection";
import { AppearanceSettingsSection } from "./AppearanceSettingsSection";
import { FeedbackSettingsSection } from "./FeedbackSettingsSection";
import { DataManagementSettingsSection } from "./DataManagementSettingsSection";
import { AboutSettingsSection } from "./AboutSettingsSection";

settingsSectionRegistry.register("security", SecuritySettingsSection, 1);
settingsSectionRegistry.register("privacy", PrivacySettingsSection, 2);
settingsSectionRegistry.register("appearance", AppearanceSettingsSection, 3);
settingsSectionRegistry.register("feedback", FeedbackSettingsSection, 4);
settingsSectionRegistry.register(
  "dataManagement",
  DataManagementSettingsSection,
  5
);
settingsSectionRegistry.register("about", AboutSettingsSection, 6);

export { settingsSectionRegistry };
