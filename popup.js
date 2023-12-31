document.addEventListener('DOMContentLoaded', function () {
    const noteTextarea = document.getElementById('note');
    const saveNoteButton = document.getElementById('saveNote');
    const notesListContainer = document.getElementById('notesList');
  
    // Load saved notes for the current URL
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      const currentUrl = currentTab.url;
  
      chrome.storage.sync.get([currentUrl], function (result) {
        const notes = result[currentUrl] || [];
  
        // Display all notes for the current website
        displayNotes(notes);
      });
    });
  
    // Save note when the button is clicked
    saveNoteButton.addEventListener('click', function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0];
        const currentUrl = currentTab.url;
        const note = noteTextarea.value;
        const currentTime = new Date().toLocaleString();
  
        chrome.storage.sync.get([currentUrl], function (result) {
          const notes = result[currentUrl] || [];
          const newNote = { note, time: currentTime };
  
          // Check if the note is already present to avoid duplication
          const isDuplicate = notes.some(savedNote => savedNote.note === newNote.note && savedNote.time === newNote.time);
  
          if (!isDuplicate) {
            notes.unshift(newNote);
  
            chrome.storage.sync.set({ [currentUrl]: notes }, function () {
              // Notify that the note was saved
              noteTextarea.value = '';
  
              // Display the new note along with previous notes
              displayNotes([newNote, ...notes]);
  
              // Refresh the popup to show saved notes
              chrome.runtime.getBackgroundPage(function (backgroundPage) {
                backgroundPage.location.reload();
              });
            });
          }
        });
      });
    });
    function displayNotes(notes) {
        notesListContainer.innerHTML = '';
      
        // Use a Set to keep track of unique notes based on content
        const uniqueNotesSet = new Set();
      
        notes.forEach(function (note) {
          uniqueNotesSet.add(note.note);
        });
      
        // Convert the Set back to an array
        const uniqueNotesArray = Array.from(uniqueNotesSet);
      
        // Create an array of objects with note content and time
        const uniqueNotesWithTimeArray = uniqueNotesArray.map(function (uniqueNote) {
          const time = notes.find(function (note) {
            return note.note === uniqueNote;
          }).time;
      
          return { note: uniqueNote, time: time };
        });
      
        uniqueNotesWithTimeArray.forEach(function (uniqueNoteWithTime) {
          const noteItem = document.createElement('div');
          noteItem.className = 'note-item';
          noteItem.textContent = `${uniqueNoteWithTime.note} (${uniqueNoteWithTime.time})`;
      
          const deleteButton = document.createElement('button');
          deleteButton.className = 'delete-button';
          deleteButton.textContent = 'Delete';
          deleteButton.addEventListener('click', function () {
            deleteNote(uniqueNoteWithTime);
          });
          noteItem.appendChild(deleteButton);
    
          notesListContainer.appendChild(noteItem);
        });
      }
      function deleteNote(uniqueNoteWithTime) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          const currentTab = tabs[0];
          const currentUrl = currentTab.url;
      
          chrome.storage.sync.get([currentUrl], function (result) {
            const notes = result[currentUrl] || [];
      
            // Find the index of the selected note
            const index = notes.findIndex(note => (
              note.note === uniqueNoteWithTime.note && note.time === uniqueNoteWithTime.time
            ));
      
            if (index !== -1) {
              // Remove the selected note
              const deletedNote = notes.splice(index, 1)[0];
      
              chrome.storage.sync.set({ [currentUrl]: notes }, function () {
                // Notify that the note was deleted
                console.log('Note deleted:', deletedNote);
      
                // Refresh the popup to show updated notes
                displayNotes(notes);
              });
            }
          });
        });
      }
      
      
    
  });
  