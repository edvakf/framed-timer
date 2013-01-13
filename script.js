$(function() {
  var lines = []; // 新しいのが一番前

  $.ajax({
    type: 'GET',
    url: 'api.php',
    //data: {since_id: lines.length ? lines[lines.length - 1].id : 0},
    dataType: 'json'
  })
  .success(function(response, responseText, xhr) {
    if (response.error) return;
    $.each(response, function(i, line) {
      var li = $('<li></li>');
      li.text(line.line);
      $('#comments').prepend(li);
    });
  });

  $(window).on('dblclick', function(e) {
    $('#controller').toggleClass('hidden');
  });

  $("#command-line").on('submit', function() {
    if ($('#command').val() === '') return false;

    $.post($(this).attr("action"), $(this).serialize(), function(response) {
      if (response.error) return;
      var li = $('<li></li>');
      li.text(response.line);
      $('#comments').prepend(li);
    }, 'json');

    $('#command').val('');
    return false;
  });
});
