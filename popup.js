// popup.js – öffnet Datenschutzerklärung in einem neuen kleinen Fenster
function openPopup(event, url) {
  event.preventDefault();
  window.open(url, '_blank', 'width=600,height=700,resizable=yes,scrollbars=yes');
}
