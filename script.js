$(function() {
  $.ajax({
    type: 'GET',
    url: 'api.php',
    //data: {since_id: lines.length ? lines[lines.length - 1].id : 0},
    dataType: 'json'
  })
  .success(function(response, responseText, xhr) {
    if (response.error) return;
    $.each(response, function(i, line) {
      addCommand(line);
    });
  });

  $(window).on('dblclick', function(e) {
    $('#controller').toggleClass('hidden');
  });

  $("#command-line").on('submit', function() {
    if ($('#command').val() === '') return false;

    $.post($(this).attr("action"), $(this).serialize(), function(response) {
      if (response.error) return;
      addCommand(response);
    }, 'json');

    $('#command').val('');
    return false;
  });
});

function addCommand(line) {
  $('#commands').prepend(
    $('<li></li>').
    text(line.line).
    attr('id', 'command-' + line.id).
    attr('insert_time', new Date(line.insert_time)/1000)
  );
}
