import { faker } from "@faker-js/faker";
import { Factory } from "fishery";
import { Calendar } from "@/lib/graphql/generated";

const CalendarFactory = Factory.define<Calendar>(() => ({
  id: faker.string.uuid(),
  category: "1",
  title: faker.lorem.sentence(3),
  link: '#0',
  content: faker.lorem.paragraphs(),
  dates: {
    to: "Jan 20",
    from: "Jan 27",
  },
  type: 'One-Time',
}));

export default CalendarFactory;
