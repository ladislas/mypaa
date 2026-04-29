# CONTEXT.md Format

Keep one repo-root `CONTEXT.md`.

It should stand on its own for local readers. Add short source refs only when they improve provenance without forcing the reader to click away for the basic meaning.

## Structure

```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Language

**Order**:
{A concise description of the term}
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account

## Relationships

- An **Order** produces one or more **Invoices**
- An **Invoice** belongs to exactly one **Customer**

## Example dialogue

> **Dev:** "When a **Customer** places an **Order**, do we create the **Invoice** immediately?"
> **Domain expert:** "No — an **Invoice** is only generated once a **Fulfillment** is confirmed."

## Flagged ambiguities

- "account" was used to mean both **Customer** and **User** — resolved: these are distinct concepts.
```

## Rules

- **Be opinionated.** When multiple words exist for the same concept, pick the best one and list the others as aliases to avoid.
- **Flag conflicts explicitly.** If a term is used ambiguously, call it out in "Flagged ambiguities" with a clear resolution.
- **Keep definitions tight.** One sentence max. Define what it is, not what it does.
- **Show relationships.** Use bold term names and express cardinality where obvious.
- **Only include project-specific concepts.** General programming concepts do not belong even if the project uses them heavily.
- **Group terms under subheadings** when natural clusters emerge. If all terms belong to a single cohesive area, a flat list is fine.
- **Write an example dialogue.** Show how the terms interact naturally and clarify boundaries between related concepts.
- **Update sparingly.** Only write `CONTEXT.md` when the session resolves stable reusable facts worth preloading next time.
- **Propose changes first.** Show the planned additions or edits in chat before writing the file.
- **Source refs are optional.** Add short `_Source_:` refs only when they help future readers trace an important decision.
