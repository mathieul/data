var get = Ember.get, set = Ember.set, getPath = Ember.getPath;

var store, adapter;
var Comment;

module("Association/adapter integration test", {
  setup: function() {
    adapter = DS.Adapter.create();

    store = DS.Store.create({
      isDefaultStore: true,
      adapter: adapter
    });

    Comment = DS.Model.extend();
    Comment.reopen({
      body: DS.attr('string'),
      comments: DS.hasMany(Comment),
      comment: DS.belongsTo(Comment)
    });
  },

  teardown: function() {
    store.destroy();
  }
});

test("when adding a record to an association that belongs to another record that has not yet been saved, only the parent record is saved", function() {
  expect(2);

  var transaction = store.transaction();
  var parentRecord = transaction.createRecord(Comment);
  var childRecord = transaction.createRecord(Comment);

  parentRecord.get('comments').pushObject(childRecord);

  var createCalled = 0;
  adapter.createRecord = function(store, type, record) {
    createCalled++;
    if (createCalled === 1) {
      equal(record, parentRecord, "parent record is committed first");
      store.didCreateRecord(record, { id: 1 });
    } else if (createCalled === 2) {
      equal(record, childRecord, "child record is committed after its parent is committed");
    }
  };

  transaction.commit();
});

var async = function(callback, timeout) {
  stop();

  timeout = setTimeout(function() {
    start();
    ok(false, "Timeout was reached");
  }, timeout || 100);

  return function() {
    clearTimeout(timeout);

    start();
    callback();
  };
};

test("an association has an isLoaded flag that indicates whether the ManyArray has finished loaded", function() {
  expect(7);

  var array;

  adapter.find = function(store, type, id) {
    setTimeout(async(function() {
      equal(array.get('isLoaded'), false, "Before loading, the array isn't isLoaded");
      store.load(type, { id: id });

      if (id === 3) {
        equal(array.get('isLoaded'), true, "After loading all records, the array isLoaded");
      } else {
        equal(array.get('isLoaded'), false, "After loading some records, the array isn't isLoaded");
      }
    }), 1);
  };

  array = store.findMany(Comment, [ 1, 2, 3 ]);
  equal(get(array, 'isLoaded'), false, "isLoaded should not be true when first created");
});
