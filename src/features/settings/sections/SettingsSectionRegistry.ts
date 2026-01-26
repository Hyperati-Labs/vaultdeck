import { ReactNode } from "react";

export type SettingsSectionComponent = (props: any) => ReactNode;

type SectionEntry = {
  id: string;
  component: SettingsSectionComponent;
  order: number;
};

class SettingsSectionRegistry {
  private sections: SectionEntry[] = [];

  register(id: string, component: SettingsSectionComponent, order: number) {
    if (this.sections.find((s) => s.id === id)) {
      this.sections = this.sections.map((s) =>
        s.id === id ? { ...s, component, order } : s
      );
      return;
    }
    this.sections.push({ id, component, order });
  }

  getAll(): SectionEntry[] {
    return [...this.sections].sort((a, b) => a.order - b.order);
  }
}

export const settingsSectionRegistry = new SettingsSectionRegistry();
