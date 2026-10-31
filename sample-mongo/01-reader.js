db.getSiblingDB("admin").createUser({
  user: "chinook_reader",
  pwd: "chinook_reader",
  roles: [{ role: "read", db: "chinook" }],
});
