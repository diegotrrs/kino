import { faker } from "@faker-js/faker";
import { Factory } from "fishery";
import { Calendar } from "@/lib/graphql/generated";

const CalendarFactory = Factory.define<Calendar>(() => ({
  id: faker.string.uuid(),
  name: faker.lorem.sentence(3),
  description: faker.lorem.paragraphs(),
  dates: {
    to: "Jan 20",
    from: "Jan 27",
  },
}));

export default CalendarFactory;
