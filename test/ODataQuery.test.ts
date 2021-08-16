import { expect } from "chai";
import { ODataQuery } from "../src";
import { MockFetch } from "./mock-fetch";

describe("ODataQuery", () => {
    const endpoint = "/odata/users";
    const baseQuery = ODataQuery.forV4<Person>(endpoint);

    it("should produce base URL with no query", () => {
        expect(baseQuery.provider.buildQuery(baseQuery.expression)).to.be.eql(endpoint);
    });

    it("should set select filter", () => {
        const query = baseQuery.select("firstName");

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$select=firstName`);
    });

    it("should set select filter with mulitple fields", () => {
        const query = baseQuery.select("firstName", "lastName");

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$select=${encodeURIComponent("firstName,lastName")}`);
    });

    it("should set combination select filter", () => {
        const query = baseQuery.select("firstName", "lastName")
            .select("lastName");

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$select=lastName`);
    });

    it("should set orderBy", () => {
        const query = baseQuery.orderBy(p => p.firstName);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$orderby=firstName`);
    });

    it("should set orderBy with multiple fields", () => {
        const query = baseQuery.orderBy(p => [p.firstName, p.lastName]);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$orderby=${encodeURIComponent("firstName,lastName")}`);
    });

    it("should set orderBy multiple times", () => {
        const query = baseQuery.orderBy(p => [p.firstName, p.lastName]).orderBy(p => p.age);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$orderby=${encodeURIComponent("firstName,lastName,age")}`);
    });

    it("should set orderByDescending", () => {
        const query = baseQuery.orderByDescending(p => p.firstName);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$orderby=${encodeURIComponent("firstName desc")}`);
    });

    it("should set orderByDescending with multiple fields", () => {
        const query = baseQuery.orderByDescending(p => [p.firstName, p.lastName]);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$orderby=${encodeURIComponent("firstName desc,lastName desc")}`);
    });

    it("should set orderByDescending multiple times", () => {
        const query = baseQuery.orderByDescending(p => [p.firstName, p.lastName]).orderByDescending(p => p.age);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$orderby=${encodeURIComponent("firstName desc,lastName desc,age desc")}`);
    });

    it("should set orderBy and orderByDescending multiple times", () => {
        const query = baseQuery.orderByDescending(p => p.firstName).orderBy(p => p.age).orderByDescending(p => p.lastName);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$orderby=${encodeURIComponent("firstName desc,age,lastName desc")}`);
    });

    it("should set skip", () => {
        const query = baseQuery.skip(10);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$skip=10`);
    });

    it("should ignore skip if set to 0", () => {
        const query = baseQuery.skip(0);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}`);
    });

    it("should set last skip value provided", () => {
        const query = baseQuery.skip(10).skip(5);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$skip=5`);
    });

    it("should set top", () => {
        const query = baseQuery.top(10);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$top=10`);
    });

    it("should set top to 0", () => {
        const query = baseQuery.top(0);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$top=0`);
    });

    it("should set last skip value provided", () => {
        const query = baseQuery.top(10).top(5);

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$top=5`);
    });

    it("should handle cumulative expand", () => {
        const query = baseQuery.expand("children");

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$expand=children`);
    });

    it("should handle cumulative expands", () => {
        const query = baseQuery.expand("children").expand("pets");

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$expand=${encodeURIComponent("children,pets")}`);
    });

    it("should handle mulitple expands in one call", () => {
        const query = baseQuery.expand("children", "pets");

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$expand=${encodeURIComponent("children,pets")}`);
    });

    it("should not repeat expands", () => {
        const query = baseQuery.expand("children", "pets").expand("pets");

        expect(query.provider.buildQuery(query.expression)).to.be.eql(`${endpoint}?$expand=${encodeURIComponent("children,pets")}`);
    });

    const test = baseQuery.selectWithProxy(p => ({
        foo: { bar: p.email}
    }));
});

interface Person {
    firstName: string;
    lastName: string;
    age: number;
    email: string;
    children: string[];
    pets: string[];
}