import { settingsSectionRegistry } from "./SettingsSectionRegistry";
import { SecuritySettingsSection } from "./SecuritySettingsSection";
import { AppearanceSettingsSection } from "./AppearanceSettingsSection";
import { FeedbackSettingsSection } from "./FeedbackSettingsSection";
import { DataManagementSettingsSection } from "./DataManagementSettingsSection";
import { AboutSettingsSection } from "./AboutSettingsSection";

settingsSectionRegistry.register("security", SecuritySettingsSection, 1);
settingsSectionRegistry.register("appearance", AppearanceSettingsSection, 2);
settingsSectionRegistry.register("feedback", FeedbackSettingsSection, 3);
settingsSectionRegistry.register(
  "dataManagement",
  DataManagementSettingsSection,
  4
);
settingsSectionRegistry.register("about", AboutSettingsSection, 5);

export { settingsSectionRegistry };
