import { ResourceLink } from "./types";

/**
 * Service/tool links for the Resources hub — modelled on GhanaWeb's
 * Resources page. Static content, not editorial, so it lives in code rather
 * than the store.
 */
export const RESOURCES: ResourceLink[] = [
  {
    id: "currency",
    title: "Currency Converter",
    description: "Live exchange rates for the Ghana Cedi against major currencies.",
    href: "/resources/currency",
    icon: "currency",
    group: "Tools",
  },
  {
    id: "weather",
    title: "Weather",
    description: "Forecasts for Accra, Kumasi, Tamale and every region.",
    href: "/resources/weather",
    icon: "weather",
    group: "Tools",
  },
  {
    id: "dictionary",
    title: "Twi–English Dictionary",
    description: "Look up words and phrases across Ghana's major languages.",
    href: "/resources/dictionary",
    icon: "dictionary",
    group: "Tools",
  },
  {
    id: "events",
    title: "Events Calendar",
    description: "Concerts, conferences and public holidays across the country.",
    href: "/resources/events",
    icon: "events",
    group: "Tools",
  },
  {
    id: "business",
    title: "Business Directory",
    description: "Find registered businesses and service providers near you.",
    href: "/resources/business-directory",
    icon: "business",
    group: "Directory",
  },
  {
    id: "jobs",
    title: "Jobs",
    description: "The latest vacancies from employers across Ghana.",
    href: "/resources/jobs",
    icon: "jobs",
    group: "Directory",
  },
  {
    id: "classifieds",
    title: "Classifieds",
    description: "Buy, sell and browse listings from readers nationwide.",
    href: "/resources/classifieds",
    icon: "classifieds",
    group: "Directory",
  },
  {
    id: "map",
    title: "Ghana Map",
    description: "An interactive map of Ghana's regions and districts.",
    href: "/resources/map",
    icon: "map",
    group: "Directory",
  },
  {
    id: "photos",
    title: "Photo Galleries",
    description: "Photojournalism and picture stories from our reporters.",
    href: "/resources/photos",
    icon: "photos",
    group: "Media",
  },
  {
    id: "radio",
    title: "Gh News Radio",
    description: "Listen live to Gh News radio from anywhere.",
    href: "/resources/radio",
    icon: "radio",
    group: "Media",
  },
];

export function resourcesByGroup(): { group: string; items: ResourceLink[] }[] {
  const order = ["Tools", "Directory", "Media", "Community"];
  return order
    .map((group) => ({ group, items: RESOURCES.filter((r) => r.group === group) }))
    .filter((g) => g.items.length > 0);
}
