// Generated by CoffeeScript 1.8.0
(function() {
  "use strict";
  var BookmarkCompleter, DomainCompleter, HistoryCache, HistoryCompleter, MultiCompleter, RankingUtils, RegexpCache
    , SearchEngineCompleter, Suggestion, TabCompleter, Decoder, root,

  Suggestion = (function() {
    function Suggestion(queryTerms, type, url, text, title, computeRelevancy, extraData) {
      this.queryTerms = queryTerms;
      this.type = type;
      this.url = url;
      this.text = text || url;
      this.title = title || "";
      this.relevancy = computeRelevancy(this, extraData);
    }

    Suggestion.prepareHtml = function(suggestion) {
      if (! suggestion.queryTerms) { return; }
      suggestion.title && (suggestion.title = suggestion.highlightTerms(suggestion.title));
      suggestion.text = suggestion.shortenUrl(suggestion.text);
      suggestion.textSplit = suggestion.highlight1(suggestion.text);
      delete suggestion.queryTerms;
    };

    Suggestion._domA = undefined;
    Suggestion.getUrlRoot = function(url) {
      var a = Suggestion._domA || (Suggestion._domA = document.createElement("a"));
      a.href = url;
      return a.protocol + "//" + a.hostname;
    };

    Suggestion.prototype.shortenUrl = function(url) {
      return url.substring((url.startsWith("http://")) ? 7 : (url.startsWith("https://")) ? 8 : 0,
        url.length - +(url.charCodeAt(url.length - 1) === 47));
    };

    Suggestion.prototype.pushMatchingRanges = function(string, term, ranges) {
      var index = 0, textPosition = 0, matchedEnd,
        splits = string.split(RegexpCache.get(term, "(", ")")),
        _ref = splits.length - 2;
      for (; index <= _ref; index += 2) {
        matchedEnd = (textPosition += splits[index].length) + splits[index + 1].length;
        ranges.push([textPosition, matchedEnd]);
        textPosition = matchedEnd;
      }
    };

    Suggestion.prototype.highlightTerms = function(string) {
      var ranges = this.highlight1(string), _i, out, start, end;
      if (ranges.length === 0) {
        return Utils.escapeHtml(string);
      }
      out = [];
      for(_i = 0, end = 0; _i < ranges.length; _i += 2) {
        start = ranges[_i];
        out.push(Utils.escapeHtml(string.substring(end, start)));
        end = ranges[_i + 1];
        out.push("<span class=\"vimB vimI vomnibarMatch\">");
        out.push(Utils.escapeHtml(string.substring(start, end)));
        out.push("</span>");
      }
      out.push(Utils.escapeHtml(string.substring(end)));
      return out.join("");
    };

    Suggestion.prototype.highlight1 = function(string) {
      var ranges = [], _i, _len;
      for (_i = 0, _len = this.queryTerms.length; _i < _len; ++_i) {
        this.pushMatchingRanges(string, this.queryTerms[_i], ranges);
      }
      if (ranges.length === 0) {
        return ranges;
      }
      ranges.sort(Suggestion.sortBy0);
      return this.mergeRanges(ranges);
    };

    Suggestion.sortBy0 = function(a, b) {
      return a[0] - b[0];
    };

    Suggestion.prototype.mergeRanges = function(ranges) {
      var mergedRanges = ranges.shift(), i = 1;
      ranges.forEach(function(range) {
        if (mergedRanges[i] >= range[0]) {
          if (mergedRanges[i] < range[1]) {
            mergedRanges[i] = range[1];
          }
        } else {
          mergedRanges.concat(range);
          i += 2;
        }
      });
      return mergedRanges;
    };

    return Suggestion;
  })();

  BookmarkCompleter = (function() {
    function BookmarkCompleter() {
      this.bookmarks = undefined;
      this.currentSearch = null;
      this.readTree = this.readTree.bind(this);
    }

    BookmarkCompleter.prototype.folderSeparator = "/";

    BookmarkCompleter.prototype.filter = function(queryTerms, onComplete) {
      this.currentSearch = {
        queryTerms: queryTerms,
        onComplete: onComplete
      };
      if (this.bookmarks) {
        this.performSearch();
      }
      else if (this.bookmarks === undefined) {
        this.refresh();
      }
    };

    BookmarkCompleter.prototype.onBookmarksLoaded = function() {
      if (this.currentSearch) {
        this.performSearch();
      }
    };

    BookmarkCompleter.prototype.performSearch = function() {
      if (this.currentSearch.queryTerms.length == 0) {
        var onComplete = this.currentSearch.onComplete;
        this.currentSearch = null;
        onComplete([]);
        return;
      }
      var q = this.currentSearch.queryTerms, c = this.computeRelevancy, results, usePathAndTitle;
      usePathAndTitle = this.currentSearch.queryTerms.join("").indexOf(this.folderSeparator) >= 0;
      results = this.bookmarks.filter(usePathAndTitle ? function(i) {
        return RankingUtils.matches(q, i.text + '\n' + i.path);
      } : function(i) {
        return RankingUtils.matches(q, i.text + '\n' + i.title);
      }).map(usePathAndTitle ? function(i) {
        return new Suggestion(q, "bookm", i.url, i.text, i.path, c);
      } : function(i) {
        return new Suggestion(q, "bookm", i.url, i.text, i.title, c);
      });
      var onComplete = this.currentSearch.onComplete;
      this.currentSearch = null;
      onComplete(results);
    };

    BookmarkCompleter.prototype.refresh = function() {
      this.bookmarks = null;
      chrome.bookmarks.getTree(this.readTree);
    };

    BookmarkCompleter.prototype.readTree = function(bookmarks) {
      this.bookmarks = this.traverseBookmarks(bookmarks).filter(BookmarkCompleter.getUrl);
      Decoder.decodeList(this.bookmarks);
      this.onBookmarksLoaded();
    };

    BookmarkCompleter.getUrl = function(b) {
      return b.url;
    };

    BookmarkCompleter.prototype.ignoreTopLevel = {
      "Other Bookmarks": true,
      "\u5176\u4ED6\u4E66\u7B7E": true,
      "Bookmarks Bar": true,
      "\u4E66\u7B7E\u680F": true,
      "Mobile Bookmarks": true
    };

    BookmarkCompleter.prototype.traverseBookmarks = function(bookmarks) {
      var results = [], _this = this;
      bookmarks.forEach(function(folder) {
        _this.traverseBookmarksRecursive(folder, results, { path: "" });
      });
      return results;
    };

    BookmarkCompleter.prototype.traverseBookmarksRecursive = function(bookmark, results, parent) {
      bookmark.path = bookmark.title && !(parent.path === "" && this.ignoreTopLevel[bookmark.title]) ? parent.path + this.folderSeparator + bookmark.title : parent.path;
      results.push(bookmark);
      if (bookmark.children) {
        var _this = this;
        bookmark.children.forEach(function(child) {
          _this.traverseBookmarksRecursive(child, results, bookmark);
        });
      }
    };

    BookmarkCompleter.prototype.computeRelevancy = function(suggestion) {
      return RankingUtils.wordRelevancy(suggestion.queryTerms, suggestion.text, suggestion.title);
    };

    return BookmarkCompleter;

  })();

  HistoryCompleter = (function() {
    function HistoryCompleter() {}
    
    HistoryCompleter.prototype.filter = function(queryTerms, onComplete) {
      var _this = this;
      if (queryTerms.length > 0) {
        HistoryCache.use(function(history) {
          onComplete(history.filter(function(entry) {
            return RankingUtils.matches(queryTerms, entry.text + '\n' + entry.title);
          }).map(function(i) {
            return new Suggestion(queryTerms, "history", i.url, i.text, i.title, _this.computeRelevancy, i.lastVisitTime);
          }));
        });
        return;
      }
      if (chrome.sessions) {
        chrome.sessions.getRecentlyClosed(null, function(sessions) {
          var historys = [], arr = {};
          sessions.forEach(function(entry) {
            if (!entry.tab || entry.tab.url in arr) { return; }
            entry.tab.lastVisitTime = entry.lastModified * 1000 + 60999;
            entry = entry.tab;
            arr[entry.url] = 1;
            historys.push(entry);
          });
          _this.filterFill(historys, onComplete, arr);
        });
        return;
      }
      chrome.windows.getCurrent(function(wnd) {
        var historys = [], arr = {}, tabs = tabQueue[wnd.id], i, entry;
        if (tabs && tabs.length > 0) {
          i = tabs.length - 1;
          do {
            entry = tabs[i];
            if (!entry.url || entry.url in arr) { continue; }
            arr[entry.url] = 1;
            historys.push({
              url: entry.url,
              title: entry.title,
              lastVisitTime: entry.lastVisitTime + 60000,
              sessionId: i
            });
          } while (--i >= 0 && historys.length < MultiCompleter.maxResults);
        }
        _this.filterFill(historys, onComplete, arr);
      });
    };
    
    HistoryCompleter.prototype.filterFill = function(historys, onComplete, arr) {
      if (historys.length >= MultiCompleter.maxResults) {
        this.filterFinish(historys, onComplete);
        return;
      }
      var _this = this;
      chrome.history.search({
        text: "",
        maxResults: MultiCompleter.maxResults
      }, function(historys2) {
        var a = arr;
        historys2 = historys2.filter(function(i) {
          return !(i.url in a);
        });
        historys = historys.concat(historys2);
        _this.filterFinish(historys, onComplete);
      });
    };
    
    HistoryCompleter.prototype.filterFinish = function(historys, onComplete) {
      var s = Suggestion, c = this.computeRelevancyByTime, d = Decoder.decodeURL;
      onComplete(historys.sort(HistoryCompleter.rsortByLvt).slice(0, MultiCompleter.maxResults).map(function(e) {
        var o = new s([], "history", e.url, d(e.url), e.title, c, e.lastVisitTime);
        e.sessionId && (o.sessionId = e.sessionId);
        return o;
      }));
    };

    HistoryCompleter.rsortByLvt = function(a, b) {
      return b.lastVisitTime - a.lastVisitTime;
    }

    HistoryCompleter.prototype.computeRelevancy = function(suggestion, lastVisitTime) {
      var recencyScore = RankingUtils.recencyScore(lastVisitTime),
        wordRelevancy = RankingUtils.wordRelevancy(suggestion.queryTerms, suggestion.text, suggestion.title);
      return recencyScore <= wordRelevancy ? wordRelevancy : (wordRelevancy + recencyScore) / 2;
    };

    HistoryCompleter.prototype.computeRelevancyByTime = function(suggestion, lastVisitTime) {
      return RankingUtils.recencyScore(lastVisitTime);
    };

    return HistoryCompleter;

  })();

  DomainCompleter = (function() {
    function DomainCompleter() {
    }

    DomainCompleter.domains = null;

    DomainCompleter.prototype.filter = function(queryTerms, onComplete) {
      if (queryTerms.length !== 1) {
        onComplete([]);
      } else if (DomainCompleter.domains) {
        this.performSearch(queryTerms, onComplete);
      } else {
        var _this = this;
        HistoryCache.use(function(history) {
          DomainCompleter.populateDomains(history);
          _this.performSearch(queryTerms, onComplete);
        });
      }
    };

    DomainCompleter.prototype.performSearch = function(queryTerms, onComplete) {
      var domain, domainCandidates = [], query = queryTerms[0];
      for (domain in DomainCompleter.domains) {
        if (domain.indexOf(query) >= 0) {
          domainCandidates.push(domain);
        }
      }
      if (domainCandidates.length === 0) {
        onComplete([]);
        return;
      }
      domain = this.firstDomainByRelevancy(queryTerms, domainCandidates);
      onComplete([new Suggestion(queryTerms, "domain", domain, domain, null, this.computeRelevancy)]);
    };

    DomainCompleter.prototype.firstDomainByRelevancy = function(queryTerms, domainCandidates) {
      var domain, recencyScore, wordRelevancy, score, _i, _len, result = "", result_score = -1000;
      for (_i = 0, _len = domainCandidates.length; _i < _len; ++_i) {
        domain = domainCandidates[_i];
        recencyScore = RankingUtils.recencyScore(DomainCompleter.domains[domain].entry.lastVisitTime || 0);
        wordRelevancy = RankingUtils.wordRelevancy(queryTerms, domain, null);
        score = recencyScore <= wordRelevancy ? wordRelevancy : (wordRelevancy + recencyScore) / 2;
        if (score > result_score) {
          result_score = score;
          result = domain;
        }
      }
      return result;
    };

    DomainCompleter.populateDomains = function(history) {
      this.domains = {};
      history.forEach(this.onPageVisited);
      chrome.history.onVisited.addListener(this.onPageVisited);
      chrome.history.onVisitRemoved.addListener(this.onVisitRemoved);
    };

    DomainCompleter.onPageVisited = function(newPage) {
      var domain = DomainCompleter.parseDomainAndScheme(newPage.url);
      if (domain) {
        var slot = DomainCompleter.domains[domain];
        if (slot) {
          if (slot.entry.lastVisitTime < newPage.lastVisitTime) {
            slot.entry = newPage;
          }
          ++ slot.referenceCount;
        } else {
          DomainCompleter.domains[domain] = {
            entry: newPage,
            referenceCount: 1
          };
        }
      }
    };

    DomainCompleter.onVisitRemoved = function(toRemove) {
      if (toRemove.allHistory) {
        DomainCompleter.domains = {};
        return;
      }
      var domains = DomainCompleter.domains, parse = DomainCompleter.parseDomainAndScheme;
      toRemove.urls.forEach(function(url) {
        var domain = parse(url);
        if (domain && domains[domain] && (-- domains[domain].referenceCount) === 0) {
          delete domains[domain];
        }
      });
    };

    DomainCompleter.parseDomainAndScheme = function(url) {
      return Utils.hasFullUrlPrefix(url) && !Utils.hasChromePrefix(url) && url.split("/", 3).join("/");
    };

    DomainCompleter.prototype.computeRelevancy = function() {
      return 1;
    };

    return DomainCompleter;

  })();

  TabCompleter = (function() {

    function TabCompleter() {}

    TabCompleter.prototype.filter = function(queryTerms, onComplete) {
      var _this = this;
      chrome.tabs.query({}, this.filter1.bind(this, queryTerms, onComplete));
    };

    TabCompleter.prototype.filter1 = function(queryTerms, onComplete, tabs) {
      var _this = this, suggestions = tabs.filter(function(tab) {
        var text = Decoder.decodeURL(tab.url);
        if (RankingUtils.matches(queryTerms, text + '\n' + tab.title)) {
          tab.text = text;
          return true;
        }
        return false;
      }).map(function(tab) {
        var suggestion = new Suggestion(queryTerms, "tab", tab.url, tab.text, tab.title, _this.computeRelevancy);
        suggestion.sessionId = tab.id;
        suggestion.favIconUrl = tab.favIconUrl;
        return suggestion;
      });
      onComplete(suggestions);
    };

    TabCompleter.prototype.computeRelevancy = function(suggestion) {
      return RankingUtils.wordRelevancy(suggestion.queryTerms, suggestion.text, suggestion.title);
    };

    return TabCompleter;

  })();

  SearchEngineCompleter = (function() {
    function SearchEngineCompleter() {
      this.searchEngines = { ":": {} };
    }

    SearchEngineCompleter.prototype.filter = function(queryTerms, onComplete) {
      var searchEngineMatch, query2, suggestions = [];
      searchEngineMatch = this.getSearchEngineMatches(queryTerms[0]);
      if (searchEngineMatch) {
        query2 = queryTerms.slice(1).join(" ");
        searchEngineMatch = Utils.createSearchUrl(searchEngineMatch, query2);
        suggestions.push(new Suggestion(queryTerms, "search", searchEngineMatch, searchEngineMatch
          , this.getSearchEngineName(queryTerms[0]) + ": " + query2, this.computeRelevancy));
      }
      onComplete(suggestions);
    };

    SearchEngineCompleter.prototype.computeRelevancy = function() {
      return 9;
    };

    SearchEngineCompleter.prototype.refresh = function() {
      this.searchEngines = Settings.getSearchEngines();
    };

    SearchEngineCompleter.prototype.getSearchEngineMatches = function(queryTerm) {
      return this.searchEngines[queryTerm];
    };
    
    SearchEngineCompleter.prototype.getSearchEngineName = function(queryTerm) {
      return this.searchEngines[":"][queryTerm];
    };

    return SearchEngineCompleter;

  })();

  MultiCompleter = (function() {
    function MultiCompleter(completers) {
      this.completers = completers;
      this.mostRecentQuery = false;
    }

    MultiCompleter.maxResults = 10;
    
    MultiCompleter.prototype.refresh = function() {
      for (var completer, _i = 0, _len = this.completers.length; _i < _len; ++_i) {
        completer = this.completers[_i];
        if (completer.refresh) {
          completer.refresh();
        }
      }
    };

    MultiCompleter.prototype.filter = function(queryTerms, onComplete) {
      if (this.mostRecentQuery) {
        if (arguments.length !== 0) {
          this.mostRecentQuery = {
            queryTerms: queryTerms,
            onComplete: onComplete
          };
          return;
        }
        queryTerms = this.mostRecentQuery.queryTerms;
        onComplete = this.mostRecentQuery.onComplete;
      }
      RegexpCache.clear();
      this.mostRecentQuery = true;
      var r = this.completers, i = 0, l = r.length, counter = l, suggestions = [], _this = this,
        callback = function(newSuggestions) {
          suggestions = suggestions.concat(newSuggestions);
          --counter;
          if (counter > 0) { return; }
          
          newSuggestions = null;
          suggestions.sort(_this.rsortByRelevancy);
          suggestions = suggestions.slice(0, MultiCompleter.maxResults);
          suggestions.forEach(Suggestion.prepareHtml);
          onComplete(suggestions);
          suggestions = null;
          if (typeof _this.mostRecentQuery === "object") {
            setTimeout(_this.filter.bind(_this), 0);
          } else {
            _this.mostRecentQuery = false;
          }
        };
      for (; i < l; i++) {
        r[i].filter(queryTerms, callback);
      };
    };
    
    MultiCompleter.prototype.rsortByRelevancy = function(a, b) {
      return b.relevancy - a.relevancy;
    }

    return MultiCompleter;

  })();

  RankingUtils = {
    matches: function(queryTerms, thing) {
      var matchedTerm, regexp, _i, _len;
      for (_i = 0, _len = queryTerms.length; _i < _len; ++_i) {
        regexp = RegexpCache.get(queryTerms[_i], "", "");
        if (! thing.match(regexp)) {
          return false;
        }
      }
      return true;
    },
    matchWeights: {
      matchAnywhere: 1,
      matchStartOfWord: 1,
      matchWholeWord: 1,
      maximumScore: 3,
      recencyCalibrator: 2.0 / 3.0
    },
    _reduceLength: function(p, c) {
      return p - c.length;
    },
    scoreTerm: function(term, string) {
      var count, nonMatching, score;
      score = 0;
      count = 0;
      nonMatching = string.split(RegexpCache.get(term, "", ""));
      if (nonMatching.length > 1) {
        score = this.matchWeights.matchAnywhere;
        count = nonMatching.reduce(this._reduceLength, string.length);
        if (RegexpCache.get(term, "\\b", "").test(string)) {
          score += this.matchWeights.matchStartOfWord;
          if (RegexpCache.get(term, "\\b", "\\b").test(string)) {
            score += this.matchWeights.matchWholeWord;
          }
        }
      }
      return [score, count < string.length ? count : string.length];
    },
    wordRelevancy: function(queryTerms, url, title) {
      var c, maximumPossibleScore, s, term, titleCount, titleScore, urlCount, urlScore, _i, _len, _ref, _ref1;
      urlScore = titleScore = 0.0;
      urlCount = titleCount = 0;
      for (_i = 0, _len = queryTerms.length; _i < _len; ++_i) {
        term = queryTerms[_i];
        _ref = this.scoreTerm(term, url), s = _ref[0], c = _ref[1];
        urlScore += s;
        urlCount += c;
        if (title) {
          _ref1 = this.scoreTerm(term, title), s = _ref1[0], c = _ref1[1];
          titleScore += s;
          titleCount += c;
        }
      }
      maximumPossibleScore = this.matchWeights.maximumScore * queryTerms.length + 0.01;
      urlScore /= maximumPossibleScore;
      urlScore *= this.normalizeDifference(urlCount, url.length);
      if (!title) {
        return urlScore;
      }
      titleScore /= maximumPossibleScore;
      titleScore *= this.normalizeDifference(titleCount, title.length);
      return (urlScore < titleScore) ? titleScore : ((urlScore + titleScore) / 2);
    },
    timeCalibrator: 1000 * 60 * 60 * 24,
    timeAgo: Date.now() - 1000 * 60 * 60 * 24,
    recencyScore: function(lastAccessedTime) {
      var score = Math.max(0, lastAccessedTime - this.timeAgo) / this.timeCalibrator;
      return score * score * score * this.matchWeights.recencyCalibrator;
    },
    normalizeDifference: function(a, b) {
      var max = Math.max(a, b);
      return (max - Math.abs(a - b)) / max;
    }
  };

  RegexpCache = {
    _escapeRegEx: /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
    _cache: {},
    clear: function() {
      this._cache = {};
    },
    get: function(s, p, n) {
      var r = p + s.replace(this._escapeRegEx, "\\$&") + n, v;
      return (v = this._cache)[r] || (v[r] = new RegExp(r, (Utils.hasUpperCase(s) ? "" : "i")));
    }
  };

  HistoryCache = {
    size: 20000,
    history: null,
    callbacks: [],
    reset: function() {
      this.history = null;
      this.callbacks = [];
    },
    use: function(callback) {
      if (! this.history) {
        this.fetchHistory(callback);
        return;
      }
      callback(this.history);
    },
    fetchHistory: function(callback) {
      this.callbacks.push(callback);
      if (this.callbacks.length > 1) {
        return;
      }
      var _this = this;
      chrome.history.search({
        text: "",
        maxResults: this.size,
        startTime: 0
      }, function(history) {
        history.sort(function(a, b) { return a.url.localeCompare(b.url); });
        Decoder.decodeList(history);
        _this.history = history;
        chrome.history.onVisited.addListener(_this.onPageVisited.bind(_this));
        chrome.history.onVisitRemoved.addListener(_this.onVisitRemoved.bind(_this));
        for (var i = 0, len = _this.callbacks.length, callback; i < len; ++i) {
          callback = _this.callbacks[i];
          callback(_this.history);
        }
        _this.callbacks = [];
      });
    },
    onPageVisited: function(newPage) {
      var i = this.binarySearch(newPage.url, this.history);
      if (i >= 0) {
        var old = this.history[i];
        if (old.text !== old.url) {
          newPage.text = old.text;
        } else {
          Decoder.decodeList([newPage]);
        }
        this.history[i] = newPage;
      } else {
        this.history.splice(-1 - i, 0, newPage);
      }
    },
    onVisitRemoved: function(toRemove) {
      if (toRemove.allHistory) {
        this.reset();
        return;
      }
      var bs = this.binarySearch, h = this.history;
      toRemove.urls.forEach(function(url) {
        var i = bs(url, h);
        if (i >= 0) {
          h.splice(i, 1);
        }
      });
    },
    binarySearch: function(u, a) {
      var e, h = a.length - 1, l = 0, m = 0;
      while (l <= h) {
        m = Math.floor((l + h) / 2);
        e = a[m].url.localeCompare(u);
        if (e > 0) { h = m - 1; }
        else if (e < 0) { l = m + 1; }
        else { return m; }
      }
      e = a[m].url;
      if (e < u) { return -2 - m; }
      return -1 - m;
    }
  };

  Decoder = {
    decodeList: function(a) {
      var i = -1, j, l = a.length, d = Decoder, f = decodeURIComponent;
      for (; ; ) {
        try {
          while (++i < l) {
            j = a[i];
            j.text = f(j.url);
          }
          break;
        } catch (e) {
          j.text = d.dict[j.url] || (d.todos.push(j), j.url);
        }
      }
      if (! d.timer) {
        d.timer = setInterval(d.worker, d.interval);
      }
    },
    dict: {},
    todos: [], // each item is either {url: ...} or "url"
    timer: 0,
    working: -1,
    interval: 25,
    worker: function() {
      var _this = Decoder;
      if (_this.working === -1) {
        _this.init();
        _this.working = 0;
      }
      if (! _this.todos.length) {
        clearInterval(_this.timer);
      } else if (_this.working === 0) {
        var url = _this.todos[0];
        if (url.url) {
          url = url.url;
        }
        if (_this.dict[url]) {
          _this.todos.shift();
        } else {
          _this.working = 1;
          _this._link.href = "data:text/css;charset=gb2312,%23" + _this._id + "%7Bfont-family%3A%22" + url + "%22%7D";
        }
      } else if (_this.working === 1) {
        _this.working = 2;
        var text = window.getComputedStyle(_this._div).fontFamily
          , url = _this.todos.shift();
        if (url.url) {
          _this.dict[url.url] = url.text = text = text.substring(1, text.length - 1);
          url = url.url;
        } else {
          _this.dict[url] = text = text.substring(1, text.length - 1);
        }
        _this.working = 0;
        if (window._DEBUG) {
          console.log(url, " => ", text);
        }
      }
    },
    _id: "",
    _link: null,
    _div: null,
    init: function() {
      var id = this._id = '_decode' + Utils.createUniqueId(),
          link = this._link = document.createElement('link'),
          div = this._div = document.createElement('div');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      div.id = id;
      div.style.display = 'none';
      document.documentElement.appendChild(link);
      document.documentElement.appendChild(div);
    }
  };
  
  Decoder.decodeURL = (function() {
    var d = Decoder.dict, f = decodeURIComponent, t = Decoder.todos;
    return function(a) {
      try {
        return f(a);
      } catch (e) {
        return d[a] || (t.push(a), a);
      }
    };
  })();
  
  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.Suggestion = Suggestion;

  root.BookmarkCompleter = BookmarkCompleter;

  root.MultiCompleter = MultiCompleter;

  root.HistoryCompleter = HistoryCompleter;

  root.DomainCompleter = DomainCompleter;

  root.TabCompleter = TabCompleter;

  root.SearchEngineCompleter = SearchEngineCompleter;

  root.HistoryCache = HistoryCache;

  root.RankingUtils = RankingUtils;

  root.Decoder = Decoder;
  
})();
