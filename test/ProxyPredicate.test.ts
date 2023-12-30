import { ODataQuery } from "../src";
import { lambdaVariable } from "../src/lib/ProxyTypes";
import { describe, it, expect } from "vitest";

describe("useProxy", () => {
  const endpoint = "/odata/users";
  const baseQuery = ODataQuery.forV4<Person>(endpoint);

  it("should set simple filter", () => {
    const query = baseQuery.filter((p) => p.firstName.$equals("john"));
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("firstName eq 'john'")}`,
    );
  });

  it("should set compound filter", () => {
    const query = baseQuery.filter((p) => p.firstName.$equals("john").and(p.age.$greaterThanOrEqualTo(30)));
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("firstName eq 'john' and age ge 30")}`,
    );
  });

  it("should set complex filter", () => {
    const query = baseQuery.filter((p) =>
      p.firstName.$equals("john").and(p.age.$greaterThanOrEqualTo(30).or(p.lastName.$notEquals("Jones"))),
    );
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("firstName eq 'john' and (age ge 30 or lastName ne 'Jones')")}`,
    );
  });

  it("should set complex filter", () => {
    const query = baseQuery.filter((p) =>
      p.firstName
        .$equals("john")
        .and(p.age.$greaterThanOrEqualTo(30))
        .or(p.lastName.$notEquals("Jones").and(p.email.$equals(".com"))),
    );

    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent(
        "(firstName eq 'john' and age ge 30) or (lastName ne 'Jones' and email eq '.com')",
      )}`,
    );
  });

  it("should handle contains", () => {
    const query = baseQuery.filter((p) => p.firstName.$contains("jac"));
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("contains(firstName,'jac')")}`,
    );
  });

  it("should handle startsWith", () => {
    const query = baseQuery.filter((p) => p.firstName.$startsWith("jac"));
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("startsWith(firstName,'jac')")}`,
    );
  });

  it("should handle endsWith", () => {
    const query = baseQuery.filter((p) => p.firstName.$endsWith("jac"));
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("endsWith(firstName,'jac')")}`,
    );
  });

  it("should handle equals and notEquals", () => {
    const query = baseQuery.filter((p, { and }) => and(p.firstName.$equals("jac"), p.age.$notEquals(50)));
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("firstName eq 'jac' and age ne 50")}`,
    );
  });

  it("should handle greaterThan and greaterThanEqualTo", () => {
    const query = baseQuery.filter((p, { and }) =>
      and(p.firstName.$greaterThan("jac"), p.age.$greaterThanOrEqualTo(50)),
    );
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("firstName gt 'jac' and age ge 50")}`,
    );
  });

  it("should handle lessThan and lessThanEqualTo", () => {
    const query = baseQuery.filter((p, { and }) => and(p.firstName.$lessThan("jac"), p.age.$lessThanOrEqualTo(50)));
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("firstName lt 'jac' and age le 50")}`,
    );
  });

  it("should handle null comparisons", () => {
    const query = baseQuery.filter((p) => p.firstName.$equals(null));
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("firstName eq null")}`,
    );
  });

  it("should handle undefined comparisons", () => {
    const query = baseQuery.filter((p) => p.firstName.$equals(undefined));
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("firstName eq null")}`,
    );
  });

  it("should handle not", () => {
    const query = baseQuery.filter((p, { not }) => not(p.firstName.$equals("John")));
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("not firstName eq 'John'")}`,
    );
  });

  it("should handle navigation properties", () => {
    const query = baseQuery.filter((p, { not }) => not(p.mother.firstName.$equals("Jane")));
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("not mother/firstName eq 'Jane'")}`,
    );
  });

  it("should handle any", () => {
    const query = baseQuery.filter((p) => p.lastName.$in(["Jones", "Smith", "Ng"]));
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent("lastName in ('Jones','Smith','Ng')")}`,
    );
  });

  it("should work with non-filter operators", () => {
    const query = baseQuery
      .orderBy((p) => [p.age])
      .filter((p) => p.lastName.$in(["Jones", "Smith", "Ng"]))
      .select("firstName", "lastName");
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent(
        "lastName in ('Jones','Smith','Ng')",
      )}&$orderby=age&$select=${encodeURIComponent("firstName,lastName")}`,
    );
  });

  it("should handle 'any' entity collection query", () => {
    let variable = "";
    const query = baseQuery.filter((p) =>
      p.children.$any((c) => {
        variable = c[lambdaVariable];
        return c.age.$equals(4);
      }),
    );
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent(`children/any(${variable}: ${variable}/age eq 4)`)}`,
    );
  });

  it("should handle 'all' entity collection query", () => {
    let variable = "";
    const query = baseQuery.filter((p) =>
      p.children.$all((c) => {
        variable = c[lambdaVariable];
        return c.age.$equals(4);
      }),
    );
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent(`children/all(${variable}: ${variable}/age eq 4)`)}`,
    );
  });

  it("should handle 'all' entity collection query with contains", () => {
    let variable = "";
    const query = baseQuery.filter((p) =>
      p.children.$all((c) => {
        variable = c[lambdaVariable];
        return c.firstName.$contains("efg");
      }),
    );
    expect(query.provider.buildQuery(query.expression)).to.be.eql(
      `${endpoint}?$filter=${encodeURIComponent(`children/all(${variable}: contains(${variable}/firstName,'efg'))`)}`,
    );
  });
});

interface Person {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  children: Child[];
  pets: string[];
  mother: Person;
  father: Person;
}

interface Child {
  firstName: string;
  lastName: string;
  age: number;
}
