import type { Metadata } from 'next';
import { SkillQuestHome } from '@/components/skill-quest/skill-quest-home';

export const metadata: Metadata = {
  title: 'Skill Quest | Student Growth',
  description: 'Explore guided learning paths, build practical skills, and track your mastery.',
};

export default function SkillQuestPage() {
  return <SkillQuestHome />;
}
