
## 1. Document Information

### 1.1. Metadata

| Attribute     | Value                                                   |
| ------------- | ------------------------------------------------------- |
| Document Name | SDLC Standards for AI Agent - Bus Ticket Booking System |
| Document ID   | 00-quy-chuan-cho-ai-agent                               |
| Project       | Bus Ticket Booking System                               |
| Version       | v1.0                                                    |
| Status        | Draft                                                   |
| Writer        | AI Agent                                                |
| Reviewer      | Nguyen Hong Khanh                                       |
| Created Date  | 04/05/2026                                              |

### 1.2. Revision History

| Version | Date       | Updater           | Changes                                                                                          |
| ------- | ---------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| v1.0    | 04/05/2026 | Nguyen Hong Khanh | Extracted from document `00`, optimized for AI agent reading, added the role of design developer |

---

## 2. Base Standards

| Standard                | Used for                                          |
| ----------------------- | ------------------------------------------------- |
| ISO/IEC/IEEE 15289:2019 | Defining the types and content of SDLC documents. |
| ISO/IEC/IEEE 29148:2018 | Writing and verifying system requirements.        |

Project-specific conventions (document codes, file directories, statuses, checklists) are **internal tailoring**, and MUST NOT conflict with the two standards above.

MUST NOT declare the project as ISO/IEC/IEEE certified.

Mandatory unified terms: `MUST`, `MUST NOT`, `SHOULD`, `MAY`, `TBD`, `ASSUMPTION`, `OPEN QUESTION`, `RISK`, `DECISION`.

See the document directory, statuses, metadata, and presentation standards in `00-quy-chuan-cho-lap-trinh-vien.md` section 3 and section 4. The AI agent MUST follow the same standards when creating or modifying any SDLC document.

---

## B1. Roles of the AI Agent

The AI agent in this project has **3 roles**, in order of priority:

1. **System context understander**: read and master all SDLC documents, business rules, modules, actors, and business flows.
2. **Document editor**: standardize raw documents into documents complying with ISO/IEC/IEEE 15289 and 29148; detect omissions, contradictions, `TBD`, `ASSUMPTION`, `OPEN QUESTION`.
3. **Design developer**: write SRS, HLD, LLD, API specs, Database design, UI/UX flow, Security design based on the understood context.

The AI agent **MUST NOT**:

- Write or edit the source code of the system.
- Autonomously change the document status to `Approved`.
- **Expand the scope of the document without prior review from the reviewer**. If a new module, new actor, new business flow, new technology, or business requirement beyond the current framework arises, MUST stop and request reviewer confirmation before proceeding.

---

## B2. Standards for Writing Documents

| Regulation                          | Mandatory Requirement                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Follow base standards               | Use 15289 for document structure, 29148 when writing requirements.                                                        |
| Do not invent standards             | Any new convention must be clearly marked as **proposed**, and must be finalized by the reviewer.                         |
| Do not turn assumptions into facts  | Content without a source must be tagged with `TBD`, `ASSUMPTION` or `OPEN QUESTION`.                                      |
| Do not autonomously expand scope    | When expansion is needed (adding modules, actors, technologies, payment providers, etc.), must stop and request a review. |
| Edit the correct document           | When the user requests modifying the current document, edit that document directly, do not create a parallel version.     |
| Consistent terminology              | Use a single unique name for each actor, module, entity, state, error code.                                               |
| Do not output the entire text again | If only a part is edited, do not paste the entire Markdown back in the chat.                                              |

---

## B3. Procedure for Creating or Modifying Documents

When creating or modifying an SDLC document, the AI agent performs the following sequence:

1. Identify the document code in the directory `00 #3.1`.
2. Determine the document type according to 15289.
3. If the document contains requirements, apply 29148.
4. Read the input documents: SRS, raw descriptions, base files, new user requirements.
5. **Check scope**: if the task exceeds the current framework, stop and request a review before writing.
6. Only write content that has a source or is clearly marked as an assumption.
7. Check for conflicts with `00`, and existing SDLC documents.
8. Note missing parts using `TBD`, `OPEN QUESTION`, or `RISK`.
9. When modifying the current document, only edit exactly the requested part, unless restructuring is needed to fix document errors.
10. After modifying, briefly summarize the changes made.

---

## B4. Output Quality Criteria

The output of the AI agent is considered **failed** if it falls into any of the following errors:

1. Calling internal conventions international standards without clear distinction.
2. Mixing business requirements with design decisions without clearly stating the content type.
3. Writing vague requirements that cannot be verified, lack an actor, or lack a clear outcome.
4. Autonomously adding technologies, frameworks, databases, cloud providers, payment providers when not requested.
5. Autonomously changing the document status to `Approved`.
6. When the user requests modifying the current document but creating a parallel version instead.
7. **Expanding the document scope (adding new modules/actors/flows/technologies) without stopping to request a review.**
8. Writing source code instead of design documents.
