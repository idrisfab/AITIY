'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import type { EmbedNote } from '@/types/embed';

interface EmbedNotesProps {
  embedId: string;
  notes: EmbedNote[];
  onAddNote: (note: Omit<EmbedNote, 'id' | 'embedId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateNote: (noteId: string, updates: Partial<EmbedNote>) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
}

export const EmbedNotes: React.FC<EmbedNotesProps> = ({
  embedId,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [newNote, setNewNote] = useState('');
  const [isTeamVisible, setIsTeamVisible] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      await onAddNote({
        content: newNote.trim(),
        visibility: isTeamVisible ? 'team' : 'private',
        createdBy: 'current-user', // TODO: Get from auth context
        tags: extractTags(newNote),
      });
      setNewNote('');
      toast.success('Note added successfully');
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editedContent.trim()) return;

    try {
      await onUpdateNote(noteId, {
        content: editedContent.trim(),
        tags: extractTags(editedContent),
      });
      setEditingNoteId(null);
      toast.success('Note updated successfully');
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await onDeleteNote(noteId);
      toast.success('Note deleted successfully');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const extractTags = (content: string): string[] => {
    const tags = content.match(/#[\w-]+/g) || [];
    return tags.map(tag => tag.slice(1));
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => note.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(
    notes.flatMap(note => note.tags || [])
  )).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notes
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Team Visible
          </span>
          <Switch
            checked={isTeamVisible}
            onCheckedChange={setIsTeamVisible}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-4">
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <div className="relative inline-block">
            <Button
              variant="outline"
              onClick={() => document.getElementById('tagFilter')?.click()}
            >
              Tags ({selectedTags.length})
            </Button>
            <select
              id="tagFilter"
              multiple
              className="absolute opacity-0 w-full h-full cursor-pointer"
              value={selectedTags}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                setSelectedTags(selected);
              }}
            >
              {allTags.map(tag => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex space-x-4">
          <Input
            type="text"
            placeholder="Add a note... Use #tags for better organization"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleAddNote();
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={handleAddNote}
            disabled={!newNote.trim() || isAddingNote}
          >
            {isAddingNote ? 'Adding...' : 'Add Note'}
          </Button>
        </div>

        <div className="space-y-4">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              {editingNoteId === note.id ? (
                <div className="space-y-4">
                  <Input
                    type="text"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingNoteId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleUpdateNote(note.id)}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          •
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {note.visibility}
                        </span>
                      </div>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {note.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditedContent(note.content);
                        }}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 