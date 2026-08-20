export type StepMeta = {
  id: string;
  title: string;
  whyWeAsk: string;
  required: boolean;
};

export const STEPS: StepMeta[] = [
  {
    id: "welcome",
    title: "Let's build your WhoWe profile",
    whyWeAsk: "",
    required: false,
  },
  {
    id: "profile",
    title: "Your profile",
    whyWeAsk: "This is how other members will recognize and identify you.",
    required: true,
  },
  {
    id: "area",
    title: "Your area",
    whyWeAsk: "We use your general area to show nearby events and recommendations.",
    required: true,
  },
  {
    id: "interests-activities",
    title: "Interests and activities",
    whyWeAsk: "This helps us recommend plans and people you'll actually enjoy.",
    required: true,
  },
  {
    id: "languages",
    title: "Languages",
    whyWeAsk: "Helps members communicate comfortably and supports language-exchange matching.",
    required: true,
  },
  {
    id: "social-goals",
    title: "Social preferences and goals",
    whyWeAsk: "This helps us recommend relevant people and plans.",
    required: true,
  },
  {
    id: "safety-preview",
    title: "Safety, preview, and completion",
    whyWeAsk: "One last look before your profile goes live.",
    required: true,
  },
];
