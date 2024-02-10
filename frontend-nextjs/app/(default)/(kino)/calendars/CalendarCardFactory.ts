import { faker } from "@faker-js/faker";
import { Factory } from "fishery";
import { Calendar } from "@/lib/graphql/generated";

const CalendarFactory = Factory.define<Calendar>(() => ({
  id: faker.string.uuid(),
  location: faker.location.city(),
  name: faker.lorem.sentence(3),
  description: faker.lorem.paragraphs(),
  startDate: faker.date.past(),
  endDate: faker.date.future(),  
}));

export default CalendarFactory;
