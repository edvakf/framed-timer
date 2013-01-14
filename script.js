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
  tick: function(delta) {
    if (this.status === 'running') {
      if (this.pre > 0) {
        this.pre -= delta;
        if (this.pre < 0) {
          delta = -this.pre;
          this.pre = 0;
        } else {
          delta = 0;
        }
      }
      if (this.time > 0) {
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

var Fetcher = {
  force_fetch: false,
  last_fetched: 0,
  tick: function(interval) {
    var now = new Date();
    if (!this.force_fetch && now - this.last_fetched < 1000) {
      return;
    }
    this.last_fetched = now;
    this.force_fetch = false;

    var commands = $('#commands .command');
    if (commands.get(0)) {
      var since_id = commands.get(0).id.split('-')[1];
    }
    $.ajax({
      type: 'GET',
      url: 'api.php',
      data: since_id ? {since_id: since_id} : null,
      dataType: 'json'
    })
    .success(function(response, responseText, xhr) {
      if (response.error) return;
      $.each(response.reverse(), function(i, line) {
        addCommand(line);
      });
    });
  }
};

var Commenter = {
  flow_time: 5000, // 5秒
  comments: [],
  tick: function(interval) {
    var main_width = $('#main').width();
    var now = new Date();
    for (var i = this.comments.length; --i >= 0; ) {
      var comment = this.comments[i];
      var frac = (now - comment.time) / this.flow_time;
      comment.elem.css('left', main_width - (main_width + comment.width) * frac);
      if (frac > 1) {
        this.comments.splice(i, 1);
        comment.elem.remove();
      }
    }
  },
  add: function(line) {
    var insert_time = new Date(line.insert_time);
    if (new Date() - insert_time > this.flow_time) return;
    var elem = $('<p class="comment"></p>');
    var main = $('#main');
    elem.text(line.line);
    elem.css('left', main.width());
    main.append(elem);
    var available_strips = Math.floor(main.height() / elem.height());
    var nth_strip = Math.floor(insert_time / 1000) % available_strips;
    elem.css('top', main.height() * (nth_strip / available_strips));
    this.comments.push({elem: elem, width: elem.width(), time: insert_time});
  }
};

var Ticker = {
  interval: 53, // 適当に小さな素数
  start: function(func) {
    var interval = this.interval;
    setInterval(function() {
      func(interval);
    }, interval);
  }
};

$(function() {
  $(window).on('dblclick', function(e) {
    $('#controller').toggleClass('target');
  });

  $("#command-line").on('submit', function() {
    if ($('#command').val() === '') return false;

    $.post($(this).attr("action"), $(this).serialize(), function(response) {
      if (response.error) return;
      Fetcher.force_fetch = true;
    }, 'json');

    $('#command').val('');
    return false;
  });

  Ticker.start(function(interval) {
    Timer.tick(interval);
    Fetcher.tick(interval);
    Commenter.tick(interval);
  });
});

function addCommand(line) {
  processCommand(line);
  $('#commands').prepend(
    $('<li class="command"></li>').
    text(line.line).
    attr('id', 'command-' + line.id).
    attr('insert_time', new Date(line.insert_time)/1000)
  );
}

function processCommand(line) {
  if (/^\/timer (\d+)$/.test(line.line)) {
    Timer.start(RegExp.$1 * 60 * 1000);
    Timer.tick(new Date() - new Date(line.insert_time));
  } else if (line.line.indexOf('/') !== 0) {
    Commenter.add(line);
  }
}
