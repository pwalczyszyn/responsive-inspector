var popupSaveDialog = function popupSaveDialog(data) {
    var a = document.createElement('a');
    a.href = data.path;
    a.download = 'snapshot.jpg'; // Filename
    a.target = '_blank';
    a.click();
}