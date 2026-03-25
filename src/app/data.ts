export interface Inductee {
  name: string;
  slug: string;
  photo: string;
  year: number | null;
  category: "shooting" | "administrative" | "both" | null;
  bio: string | null;
  featured: boolean;
}

export const inductees: Inductee[] = [
  { name: "Hortense Wood", slug: "hortense-wood", photo: "/inductees/hortense-wood.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Pat Miller", slug: "pat-miller", photo: "/inductees/pat-miller.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Sam Sharman", slug: "sam-sharman", photo: "/inductees/sam-sharman.jpg", year: null, category: null, bio: null, featured: false },
  { name: "E.L. Ford", slug: "el-ford", photo: "/inductees/el-ford.jpg", year: null, category: null, bio: null, featured: false },
  { name: "C.H. Reilly", slug: "ch-reilly", photo: "/inductees/ch-reilly.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Gus Becker", slug: "gus-becker", photo: "/inductees/gus-becker.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Ron Sellers", slug: "ron-sellers", photo: "/inductees/ron-sellers.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Arvin Labrum", slug: "arvin-labrum", photo: "/inductees/arvin-labrum.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Ken Adamson", slug: "ken-adamson", photo: "/inductees/ken-adamson.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Ann Christie", slug: "ann-christie", photo: "/inductees/ann-christie.jpg", year: null, category: null, bio: null, featured: false },
  { name: "O.J. Coon", slug: "oj-coon", photo: "/inductees/oj-coon.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Josephine Leavitt", slug: "josephine-leavitt", photo: "/inductees/josephine-leavitt.jpg", year: null, category: null, bio: null, featured: false },
  { name: "John M. Browning", slug: "john-browning", photo: "/inductees/john-browning.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Tom Lynott", slug: "tom-lynott", photo: "/inductees/tom-lynott.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Walter Langhorst", slug: "walt-langhorst", photo: "/inductees/walt-langhorst.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Dean Hurd", slug: "dean-hurd", photo: "/inductees/dean-hurd.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Randy Freston", slug: "randy-freston", photo: "/inductees/randy-freston.jpg", year: null, category: null, bio: null, featured: false },
  { name: "H. Barr Carlisle", slug: "h-barr-carlisle", photo: "/inductees/h-barr-carlisle.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Dale Amos", slug: "dale-amos", photo: "/inductees/dale-amos.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Ron Christensen", slug: "ron-christensen", photo: "/inductees/ron-christensen.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Doug Westenskow", slug: "doug-westenskow", photo: "/inductees/doug-westenskow.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Brent Epperson", slug: "brent-epperson", photo: "/inductees/brent-epperson.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Bill Hunter", slug: "bill-hunter", photo: "/inductees/bill-hunter.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Jim Duke", slug: "jim-duke", photo: "/inductees/jim-duke.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Larry Mitchell", slug: "larry-mitchell", photo: "/inductees/larry-mitchell.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Joe Sudbury Sr.", slug: "joe-sudbury-sr", photo: "/inductees/joe-sudbury-sr.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Linda Nicholl", slug: "linda-nicholl", photo: "/inductees/linda-nicholl.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Joe Mabey", slug: "joe-mabey", photo: "/inductees/joe-mabey.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Bill Salt", slug: "bill-salt", photo: "/inductees/bill-salt.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Bob Spencer", slug: "bob-spencer", photo: "/inductees/bob-spencer.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Gene Majers", slug: "gene-majers", photo: "/inductees/gene-majers.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Stanley Jorgenson", slug: "stanley-jorgenson", photo: "/inductees/stanley-jorgenson.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Bill & LeeAnn Martin", slug: "bill-and-leeann-martin", photo: "/inductees/bill-and-leeann-martin.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Ardith Stitt", slug: "ardith-stitt", photo: "/inductees/ardith-stitt.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Sharred Oaks", slug: "sharred-oaks", photo: "/inductees/sharred-oaks.jpg", year: null, category: null, bio: null, featured: false },
  { name: "Leslie (Ford) Hight", slug: "leslie-ford-hight", photo: "/inductees/leslie-ford-hight.jpg", year: null, category: null, bio: null, featured: false },
];

/** Helper to find an inductee by slug */
export function getInducteeBySlug(slug: string): Inductee | undefined {
  return inductees.find((i) => i.slug === slug);
}

/** Helper to get featured inductees */
export function getFeaturedInductees(): Inductee[] {
  return inductees.filter((i) => i.featured);
}
