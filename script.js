var Timer = {
  pre: 0,
  time: 0,
  status: 'stop',
  start: function(time) {
    this.pre = 3000;
    this.time = time;
    this.status = 'running';
    this.display();
  },
  proceed: function(delta) {
    if (this.status === 'running') {
      if (this.pre > 0) {
        this.pre -= delta;
        if (this.pre < 0) {
          this.pre = 0;
        }
      } else {
        this.time -= delta;
        if (this.time < 0) {
          this.time = 0;
          this.pre = 3000;
          this.status = 'stop';
        }
      }
      this.display();
    }
  },
  display: function() {
    if (this.pre >= 3000) {
      var color = 'black';
    } else if (this.pre >= 2000 && this.pre < 3000) {
      var color = '#DD3333';
    } else if (this.pre >= 1000 && this.pre < 2000) {
      var color = '#BBBB00';
    } else {
      var color = '#00BB00';
    }
    $('#main').css('background-color', color);

    var time = this.time;
    var milli = time % 1000;
    time = Math.floor(time / 1000);
    var sec = time % 60;
    time = Math.floor(time / 60);
    var min = time % 60;
    $('#timer').text(('0' + min).slice(-2) + ':' + ('0' + sec).slice(-2) + '.' + ('00' + milli).slice(-3));
  },
};

var Ticker = {
  procs: [],
  start: function() {
    var interval = 53; // 適当に小さな素数
    setInterval(function() {
      Ticker.proceed(interval);
    }, interval);
  },
  add: function(func) {
    this.procs.push(func);
  },
  proceed: function(interval) {
    $.each(this.procs, function(i, func) {
      func(interval);
    });
  }
};

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

  Ticker.add(function(interval) {
    Timer.proceed(interval);
  });
  Ticker.start();
});

function addCommand(line) {
  processCommand(line);
  $('#commands').prepend(
    $('<li></li>').
    text(line.line).
    attr('id', 'command-' + line.id).
    attr('insert_time', new Date(line.insert_time)/1000)
  );
}

function processCommand(line) {
  if (/^\/timer (\d+)$/.test(line.line)) {
    Timer.start(RegExp.$1 * 60 * 1000);
  }
}
