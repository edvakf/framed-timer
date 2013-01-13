$(function() {
  var lines = []; // 新しいのが一番前

  $.ajax({
    type: 'GET',
    url: 'api.php',
    //data: {since_id: lines.length ? lines[lines.length - 1].id : 0},
    dataType: 'json'
  })
  .success(function(data, responseText, xhr) {
    console.log(arguments);
    $.each(data, function(line) {
      var li = '<li></li>';
      li.text(line);
      $('#comments').append(li);
    });
  });

  $(window).on('dblclick', function(e) {
    $('#controller').toggleClass('hidden');
  });
});
