db.getSiblingDB("admin").createUser({
  user: "shop_reader",
  pwd: "shop_reader",
  roles: [{ role: "read", db: "shop" }],
});
