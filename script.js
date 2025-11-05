document.addEventListener('DOMContentLoaded', () => {
  const dashakamSelect = document.getElementById('dashakamSelect');
  const audio = document.getElementById('audio');
  const verseDiv = document.getElementById('verse');
  const splitWordsDiv = document.getElementById('splitWords');
  const meaningDiv = document.getElementById('meaning');

  // Populate dashakam dropdown (001 to 100)
  for (let i = 1; i <= 100; i++) {
    const val = i.toString().padStart(3, '0');
    const option = document.createElement('option');
    option.value = val;
    option.textContent = `Dashakam ${val}`;
    dashakamSelect.appendChild(option);
  }

function parseCueText(text) {
  const lines = text.trim().split('\n');

  let verseLines = [];
  let splitWordLines = [];
  let meaningLines = [];

  let foundVerseEnd = false;
  let foundMeaningStart = false;

  const verseEndRegex = /॥\s*[०-९0-9]+\s*॥/;
  const isEnglishLine = line => /^[\x00-\x7F\s.,'"()\-:;!?]+$/.test(line.trim());

  for (const line of lines) {
    const trimmed = line.trim();

    if (!foundVerseEnd) {
      verseLines.push(trimmed);
      if (verseEndRegex.test(trimmed)) {
        foundVerseEnd = true;
      }
    } else if (!foundMeaningStart) {
      if (isEnglishLine(trimmed) && trimmed.length > 0) {
        foundMeaningStart = true;
        meaningLines.push(trimmed);
      } else {
        splitWordLines.push(trimmed);
      }
    } else {
      meaningLines.push(trimmed);
    }
  }

  return {
    verse: verseLines.join('\n'),
    splitWords: splitWordLines.join('\n'),
    meaning: meaningLines.join('\n')
  };
}



  function loadVTT(url) {
    return fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load VTT: ${url}`);
        return response.text();
      })
      .then(text => {
        const lines = text.split('\n');
        let cues = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i].trim();
          if (/^\d+$/.test(line)) {
            i++;
            continue;
          }
          if (line.includes('-->')) {
            let [start, end] = line.split(' --> ').map(s => s.trim());
            let cueTextLines = [];
            i++;
            while (i < lines.length && lines[i].trim() !== '') {
              cueTextLines.push(lines[i]);
              i++;
            }
            cues.push({ start, end, text: cueTextLines.join('\n') });
          }
          i++;
        }
        return cues;
      });
  }

  function timeToSeconds(timeString) {
    const parts = timeString.split(':');
    let seconds = 0;
    seconds += parseFloat(parts[2]);
    seconds += parseInt(parts[1]) * 60;
    seconds += parseInt(parts[0]) * 3600;
    return seconds;
  }

  // Helper: replace newlines with <br> for HTML display
function nl2br(str) {
  if (!str) return '';
  return str.replace(/\n/g, '<br>');
}

  let cues = [];
  let currentVttUrl = '';

  function loadDashakam(val) {
    currentVttUrl = `vtt_fixed_output/Narayaneeyam_D${val}.vtt`;
    audio.src = `audio/Narayaneeyam_D${val}.mp3`;
    audio.load();

    cues = [];

    loadVTT(currentVttUrl)
      .then(loadedCues => {
        cues = loadedCues;

        if (cues.length > 0) {
          const parts = parseCueText(cues[0].text);
          verseDiv.innerHTML = nl2br(parts.verse);
          splitWordsDiv.innerHTML = nl2br(parts.splitWords);
          meaningDiv.innerHTML = nl2br(parts.meaning);

          // Optionally start audio at first cue start
          audio.currentTime = timeToSeconds(cues[0].start);
        } else {
          verseDiv.textContent = 'No subtitles found.';
          splitWordsDiv.textContent = '';
          meaningDiv.textContent = '';
        }
      })
      .catch(error => {
        console.error(error);
        verseDiv.textContent = 'Subtitle file not found or could not be loaded.';
        splitWordsDiv.textContent = '';
        meaningDiv.textContent = '';
      });
  }

  dashakamSelect.addEventListener('change', (e) => {
    loadDashakam(e.target.value);
  });

  audio.addEventListener('timeupdate', () => {
    if (!cues.length) return;

    const currentTime = audio.currentTime;
    const currentCue = cues.find(cue => {
      return currentTime >= timeToSeconds(cue.start) && currentTime <= timeToSeconds(cue.end);
    });

if (currentCue) {
  const parts = parseCueText(currentCue.text);
  verseDiv.innerHTML = nl2br(parts.verse);
  splitWordsDiv.innerHTML = nl2br(parts.splitWords);
  meaningDiv.innerHTML = nl2br(parts.meaning);
} else {
  verseDiv.innerHTML = '';
  splitWordsDiv.innerHTML = '';
  meaningDiv.innerHTML = '';
}
  });

  // Load the first Dashakam by default
  loadDashakam('001');
});

let repeatVerse = false;
let repeatDashakam = false;
let currentCueIndex = -1;
let speedOptions = [1, 1.5, 2, 0.75];
let speedIndex = 0;

const repeatVerseBtn = document.getElementById('repeatVerseBtn');
const repeatDashakamBtn = document.getElementById('repeatDashakamBtn');
const speedBtn = document.getElementById('speedBtn');

repeatVerseBtn.addEventListener('click', () => {
  repeatVerse = !repeatVerse;
  repeatVerseBtn.style.color = repeatVerse ? 'green' : '';
});

repeatDashakamBtn.addEventListener('click', () => {
  repeatDashakam = !repeatDashakam;
  repeatDashakamBtn.style.color = repeatDashakam ? 'green' : '';
});

speedBtn.addEventListener('click', () => {
  speedIndex = (speedIndex + 1) % speedOptions.length;
  audio.playbackRate = speedOptions[speedIndex];
  speedBtn.title = `Speed: ${speedOptions[speedIndex]}x`;
});

// Update your timeupdate logic to support repeat verse
audio.addEventListener('timeupdate', () => {
  if (!cues.length) return;
  const currentTime = audio.currentTime;
  const newCueIndex = cues.findIndex(cue => {
    return currentTime >= timeToSeconds(cue.start) && currentTime <= timeToSeconds(cue.end);
  });

  if (newCueIndex !== -1 && newCueIndex !== currentCueIndex) {
    currentCueIndex = newCueIndex;
    const parts = parseCueText(cues[currentCueIndex].text);
    verseDiv.innerHTML = nl2br(parts.verse);
    splitWordsDiv.innerHTML = nl2br(parts.splitWords);
    meaningDiv.innerHTML = nl2br(parts.meaning);
  }

  // Repeat current verse
  if (repeatVerse && currentCueIndex !== -1) {
    const cue = cues[currentCueIndex];
    if (currentTime >= timeToSeconds(cue.end)) {
      audio.currentTime = timeToSeconds(cue.start);
    }
  }

  // Repeat Dashakam
  if (repeatDashakam && currentCueIndex === cues.length - 1) {
    const cue = cues[currentCueIndex];
    if (currentTime >= timeToSeconds(cue.end)) {
      audio.currentTime = 0;
    }
  }
});

