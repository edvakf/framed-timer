var Timer = {
  pre: 0,
  time: 0,
  post: 0,
  status: 'stop',
  start: function(time) {
    this.pre = 3000;
    this.time = time;
    this.post = 3000;
    this.status = 'running';
    this.display();
  },
  tick: function(delta) {
    if (this.status === 'running') {
      // pre, time, post の順に減っていく処理。もうちょっと短く書きたい…
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
          delta = -this.time;
          this.time = 0;
        } else {
          delta = 0;
        }
      }
      if (this.post > 0) {
        this.post -= delta;
        if (this.post < 0) {
          this.post = 0;
          this.status = 'stop';
        }
      }
      this.display();
    }
  },
  display: function() {
    if (this.pre > 0) {
      $('#main').attr('class', 'pre-timer');
    } else if (this.time > 0) {
      $('#main').attr('class', 'during-timer');
    } else if (this.post > 0) {
      $('#main').attr('class', 'post-timer');
    } else {
      $('#main').attr('class', '');
    }

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
  last_fetch_time: 0,
  last_fetch_id: 0,
  tick: function(interval) {
    var now = new Date();
    if (!this.force_fetch && now - this.last_fetch_time < 1000) {
      return;
    }
    this.last_fetch_time = now;
    this.force_fetch = false;

    var since_id = this.last_fetch_id;
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
  levels: 10,
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
    var nico = new NicoNicoLikeCommentLevel(this.levels + 1);
    $.each(this.comments, function(i, comment) {
      nico.add(comment.level);
    });
    var level = nico.choose();
    elem.css('top', level / this.levels * (main.height() - elem.height()));
    this.comments.push({elem: elem, width: elem.width(), time: insert_time, level: level});
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
  if (/^\/timer(\d[\d.]*)$/.test(line.line)) {
    Timer.start(RegExp.$1 * 60 * 1000);
    Timer.tick(new Date() - new Date(line.insert_time));
  } else if (line.line.indexOf('/') !== 0) {
    Commenter.add(line);
  }
  Fetcher.last_fetch_id = +line.id;

  $('#commands').prepend($('<li class="command"></li>').text(line.line));
  var commands = $('#commands .command');
  if (commands[30]) $(commands[30]).remove();
}

function NicoNicoLikeCommentLevel(n) {
  this.max_level = n;
  this.other_comment_levels = [];
  for (var i = 0; i < n; i++) {
    this.other_comment_levels[i] = 0;
  }
}

NicoNicoLikeCommentLevel.prototype.add = function(level) {
  this.other_comment_levels[level] += 1;
}

NicoNicoLikeCommentLevel.prototype.choose = function() {
  var min = Math.min.apply(null, this.other_comment_levels);
  for (var i = 0; i < this.max_level; i++) {
    if (this.other_comment_levels[i] === min) {
      return i;
    }
  }
}
