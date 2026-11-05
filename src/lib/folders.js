export const FOLDERS = [
  { id: 'personal', name: 'Personal', icon: 'folder' },
  { id: 'work', name: 'Work', icon: 'briefcase' },
  { id: 'projects', name: 'Projects', icon: 'layers' },
  { id: 'templates', name: 'Templates', icon: 'template' },
]

export const folderName = (id) => FOLDERS.find((folder) => folder.id === id)?.name ?? 'My Docs'
