export interface CustomerStory {
  quote: string;
  name: string;
  detail: string;
}

export const customerStories: CustomerStory[] = [
  {
    quote: 'AllDent came out after a massive hail storm and fixed every dent on my truck. You can\'t even tell it was damaged. They saved me thousands compared to a body shop.',
    name: 'Mike R.',
    detail: 'Dallas, TX — Hail Damage Repair',
  },
  {
    quote: 'Super professional and fast. They came to my office parking lot, fixed a door ding in under an hour, and it looks perfect. Highly recommend All Dent PDR.',
    name: 'Sarah T.',
    detail: 'Cleveland, OH — Door Ding Removal',
  },
  {
    quote: 'We use AllDent for all our lot damage repairs. They\'re reliable, the pricing is fair, and the results are flawless every time. Our go-to PDR team.',
    name: 'James K.',
    detail: 'Louisville, KY — Dealership Partner',
  },
  {
    quote: 'My truck had hail damage all over the hood and roof. All Dent PDR got it looking new again in two days. The insurance handled everything. Highly recommend to anyone in Bedford.',
    name: 'Tom H.',
    detail: 'Bedford, OH — Hail Damage Repair',
  },
  {
    quote: 'I was skeptical about paintless repair but they showed me the car under the lights before and after. Zero visible dents. Factory paint completely intact. Worth every penny.',
    name: 'Lisa M.',
    detail: 'Parma, OH — Paintless Dent Repair',
  },
  {
    quote: 'Fast, professional, and honest. They quoted me exactly what it cost — no surprise charges. The shop is close to my work in Garfield Heights so drop-off was easy.',
    name: 'David W.',
    detail: 'Garfield Heights, OH — Door Ding Repair',
  },
];
