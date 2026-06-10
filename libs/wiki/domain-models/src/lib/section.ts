export interface Section {
  heading: string;
  level: number;
  content: string;
  subsections: Section[];
}
