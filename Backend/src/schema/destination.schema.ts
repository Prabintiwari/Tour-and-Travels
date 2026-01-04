import z from "zod";

const destinationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  region: z.string().min(1, "Region is required"),
  location: z.string().min(1, "Location is required"),
  bestTimeToVisit: z.string().min(1, "Best time to visit is required"),
  attractions: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }, z.array(z.string()).min(1)),
});
export { destinationSchema };
