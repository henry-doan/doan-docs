/** Starting points for new documents. Content is plain editor HTML. */
export const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank document',
    description: 'A clean page.',
    title: 'Untitled document',
    content: '<p></p>',
  },
  {
    id: 'meeting-notes',
    name: 'Meeting notes',
    description: 'Agenda, decisions and action items.',
    title: 'Meeting notes',
    content:
      '<h1>Meeting notes</h1><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><h2>Agenda</h2><ol><li></li></ol><h2>Decisions</h2><ul><li></li></ul><h2>Action items</h2><ul><li>Owner — task — due date</li></ul>',
  },
  {
    id: 'project-plan',
    name: 'Project plan',
    description: 'Goals, scope, milestones and risks.',
    title: 'Project plan',
    content:
      '<h1>Project plan</h1><h2>Goal</h2><p>What does success look like?</p><h2>Scope</h2><ul><li>In scope:</li><li>Out of scope:</li></ul><h2>Milestones</h2><ol><li>Kickoff</li><li>First draft</li><li>Launch</li></ol><h2>Risks</h2><ul><li></li></ul>',
  },
  {
    id: 'letter',
    name: 'Letter',
    description: 'A formal letter with greeting and sign-off.',
    title: 'Letter',
    content:
      '<p>Your name<br>Street address<br>City, State ZIP</p><p>Date</p><p>Dear Recipient,</p><p>Write your letter here.</p><p>Sincerely,</p><p>Your name</p>',
  },
  {
    id: 'report',
    name: 'Report',
    description: 'Summary, findings and recommendations.',
    title: 'Report',
    content:
      '<h1>Report title</h1><p><em>Prepared by · Date</em></p><h2>Summary</h2><p>One paragraph on what this report covers and what it found.</p><h2>Findings</h2><p></p><h2>Recommendations</h2><ol><li></li></ol>',
  },
  {
    id: 'resume',
    name: 'Résumé',
    description: 'Experience, education and skills.',
    title: 'Résumé',
    content:
      '<h1>Your Name</h1><p>email@example.com · (555) 555-0100 · City, State</p><h2>Experience</h2><h3>Job title — Company</h3><p><em>Start – End</em></p><ul><li>What you accomplished</li></ul><h2>Education</h2><p>Degree — School, Year</p><h2>Skills</h2><p></p>',
  },
]

export const getTemplate = (id) => TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0]
