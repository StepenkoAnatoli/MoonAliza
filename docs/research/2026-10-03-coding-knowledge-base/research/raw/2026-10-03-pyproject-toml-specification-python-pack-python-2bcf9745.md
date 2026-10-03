---
url: https://packaging.python.org/en/latest/specifications/pyproject-toml/
retrieved: 2026-10-03
command: http-keyless scrape https://packaging.python.org/en/latest/specifications/pyproject-toml/
statusCode: 200
transport: http-keyless
completeness: partial
omitted: 14 sibling section(s) totalling ~84 words were outside the page's main content and are not in this capture
title: pyproject.toml specification - Python Packaging User Guide
---
# ` pyproject.toml ` specification[¶](#pyproject-toml-specification)


 Warning

 This is a **technical, formal specification**. For a gentle,
user-friendly guide to ` pyproject.toml `, see
[Writing your pyproject.toml](../../guides/writing-pyproject-toml/#writing-pyproject-toml).

 The ` pyproject.toml ` file acts as a configuration file for packaging-related
tools (as well as other tools).

 The ` pyproject.toml ` file is written in [TOML](https://toml.io). Three
tables are currently specified, namely
[[build-system]](#pyproject-build-system-table),
[[project]](#pyproject-project-table) and
[[tool]](#pyproject-tool-table). Other tables are reserved for future
use (tool-specific configuration should use the ` [tool] ` table).




## Declaring build system dependencies: the ` [build-system] ` table[¶](#declaring-build-system-dependencies-the-build-system-table)

 The ` [build-system] ` table declares any Python level dependencies that
must be installed in order to run the project’s build system
successfully.

 The ` [build-system] ` table is used to store build-related data.
Initially, only one key of the table is valid and is mandatory
for the table: ` requires `. This key must have a value of a list
of strings representing dependencies required to execute the
build system. The strings in this list follow the [version specifier
specification](../version-specifiers/#version-specifiers).

 An example ` [build-system] ` table for a project built with
` setuptools ` is:

 [build-system]
 # Minimum requirements for the build system to execute.
 requires = [ "setuptools" ]


 Build tools are expected to use the example configuration file above as
their default semantics when a ` pyproject.toml ` file is not present.

 Tools should not require the existence of the ` [build-system] ` table.
A ` pyproject.toml ` file may be used to store configuration details
other than build-related data and thus lack a ` [build-system] ` table
legitimately. If the file exists but is lacking the ` [build-system] `
table then the default values as specified above should be used.
If the table is specified but is missing required fields then the tool
should consider it an error.

 Tools may choose to present an error to the user if the file exists,
` [build-system] ` table is missing, and there is no clear indication
that the project should be built (e.g., no setup.py/setup.cfg or other
build configuration files, and no ` [project] ` table).

 To provide a type-specific representation of the resulting data from
the TOML file for illustrative purposes only, the following
[JSON Schema](https://json-schema.org) would match the data format:

 {
 "$schema" : "http://json-schema.org/schema#" ,

 "type" : "object" ,
 "additionalProperties" : false ,

 "properties" : {
 "build-system" : {
 "type" : "object" ,
 "additionalProperties" : false ,

 "properties" : {
 "requires" : {
 "type" : "array" ,
 "items" : {
 "type" : "string"
 }
 }
 },
 "required" : [ "requires" ]
 },

 "tool" : {
 "type" : "object"
 }
 }
 }





## Declaring project metadata: the ` [project] ` table[¶](#declaring-project-metadata-the-project-table)

 The ` [project] ` table specifies the project’s [core metadata](../core-metadata/#core-metadata).

 There are two kinds of metadata: *static* and *dynamic*. Static
metadata is specified in the ` pyproject.toml ` file directly and
cannot be specified or changed by a tool (this includes data
*referred* to by the metadata, e.g. the contents of files referenced
by the metadata). Dynamic metadata is listed via the ` dynamic ` key
(defined later in this specification) and represents metadata that a
tool will later provide.

 A key whose value is a list or a table of arbitrary entries MAY be
specified statically *and* listed in ` dynamic ` at the same time. In
that case the entries given statically are fixed and a build back-end
MAY only *append* further entries to them; the back-end MUST NOT
remove, reorder, or modify any statically-specified entries. See the
[dynamic](#pyproject-toml-dynamic) key for details.

 The lack of a ` [project] ` table implicitly means the [build backend](../../glossary/#term-Build-Backend)
will dynamically provide all keys.

 The only keys required to be statically defined are:



- ` name `

 The keys which are required but may be specified *either* statically
or listed as dynamic are:



- ` version `

 All other keys are considered optional and may be specified
statically, listed as dynamic, or left unspecified.

 The complete list of keys allowed in the ` [project] ` table are:



- ` authors `

- ` classifiers `

- ` dependencies `

- ` description `

- ` dynamic `

- ` entry-points `

- ` gui-scripts `

- ` import-names `

- ` import-namespaces `

- ` keywords `

- ` license `

- ` license-files `

- ` maintainers `

- ` name `

- ` optional-dependencies `

- ` readme `

- ` requires-python `

- ` scripts `

- ` urls `

- ` version `




### ` name `[¶](#name)



- [TOML](https://toml.io) type: string

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Name](../core-metadata/#core-metadata-name)

 The name of the project.

 Tools SHOULD [normalize](../name-normalization/#name-normalization) this name, as soon
as it is read for internal consistency.




### ` version `[¶](#version)



- [TOML](https://toml.io) type: string

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Version](../core-metadata/#core-metadata-version)

 The version of the project, as defined in the
[Version specifier specification](../version-specifiers/#version-specifiers).

 Users SHOULD prefer to specify already-normalized versions.




### ` description `[¶](#description)



- [TOML](https://toml.io) type: string

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Summary](../core-metadata/#core-metadata-summary)

 The summary description of the project in one line. Tools MAY error
if this includes multiple lines.




### ` readme `[¶](#readme)



- [TOML](https://toml.io) type: string or table

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Description](../core-metadata/#core-metadata-description) and
[Description-Content-Type](../core-metadata/#core-metadata-description-content-type)

 The full description of the project (i.e. the README).

 The key accepts either a string or a table. If it is a string then
it is a path relative to ` pyproject.toml ` to a text file containing
the full description. Tools MUST assume the file’s encoding is UTF-8.
If the file path ends in a case-insensitive ` .md ` suffix, then tools
MUST assume the content-type is ` text/markdown `. If the file path
ends in a case-insensitive ` .rst `, then tools MUST assume the
content-type is ` text/x-rst `. If a tool recognizes more extensions
than this specification, it MAY infer the content-type for the user without
specifying this key as ` dynamic `. For all unrecognized suffixes
when a content-type is not provided, tools MUST raise an error.

 The ` readme ` key may also take a table. The ` file ` key has a
string value representing a path relative to ` pyproject.toml ` to a
file containing the full description. The ` text ` key has a string
value which is the full description. These keys are
mutually-exclusive, thus tools MUST raise an error if the metadata
specifies both keys.

 A table specified in the ` readme ` key also has a ` content-type `
key which takes a string specifying the content-type of the full
description. A tool MUST raise an error if the metadata does not
specify this key in the table. If the metadata does not specify the
` charset ` parameter, then it is assumed to be UTF-8. Tools MAY
support other encodings if they choose to. Tools MAY support
alternative content-types which they can transform to a content-type
as supported by the [core metadata](../core-metadata/#core-metadata). Otherwise
tools MUST raise an error for unsupported content-types.




### ` requires-python `[¶](#requires-python)



- [TOML](https://toml.io) type: string

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Requires-Python](../core-metadata/#core-metadata-requires-python)

 The Python version requirements of the project.




### ` license `[¶](#license)



- [TOML](https://toml.io) type: string

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[License-Expression](../core-metadata/#core-metadata-license-expression)

 Text string that is a valid SPDX
[license expression](../../glossary/#term-License-Expression),
as specified in [License Expression](../license-expression/).
Tools SHOULD validate and perform case normalization of the expression.

 This key should **only** be specified if the license expression for any
and all distribution files created by a build backend using the
` pyproject.toml ` is the same as the one specified. If the license
expression will differ then it should either be specified as dynamic or
not set at all.



#### Legacy specification[¶](#legacy-specification)



- [TOML](https://toml.io) type: table

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[License](../core-metadata/#core-metadata-license)

 The table may have one of two keys. The ` file ` key has a string
value that is a file path relative to ` pyproject.toml ` to the file
which contains the license for the project. Tools MUST assume the
file’s encoding is UTF-8. The ` text ` key has a string value which is
the license of the project. These keys are mutually exclusive, so a
tool MUST raise an error if the metadata specifies both keys.

 The table subkeys were deprecated by [PEP 639](https://peps.python.org/pep-0639/) in favor of the string value.




### ` license-files `[¶](#license-files)



- [TOML](https://toml.io) type: array of strings

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[License-File](../core-metadata/#core-metadata-license-file)

 An array specifying paths in the project source tree relative to the project
root directory (i.e. directory containing ` pyproject.toml ` or legacy project
configuration files, e.g. ` setup.py `, ` setup.cfg `, etc.)
to file(s) containing licenses and other legal notices to be
distributed with the package.

 The strings MUST contain valid glob patterns, as specified in
[glob patterns](../glob-patterns/).

 Patterns are relative to the directory containing ` pyproject.toml `,

 Tools MUST assume that license file content is valid UTF-8 encoded text,
and SHOULD validate this and raise an error if it is not.

 Build tools:



- MUST include all files matched by a listed pattern in all distribution
archives.

- MUST list each matched file path under a License-File field in the
Core Metadata.

 If the ` license-files ` key is present and
is set to a value of an empty array, then tools MUST NOT include any
license files and MUST NOT raise an error.
If the ` license-files ` key is not defined, tools can decide how to handle
license files. For example they can choose not to include any files or use
their own logic to discover the appropriate files in the distribution.




### ` authors `/` maintainers `[¶](#authors-maintainers)



- [TOML](https://toml.io) type: Array of inline tables with string keys and values

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Author](../core-metadata/#core-metadata-author),
[Author-email](../core-metadata/#core-metadata-author-email),
[Maintainer](../core-metadata/#core-metadata-maintainer), and
[Maintainer-email](../core-metadata/#core-metadata-maintainer-email)

 The people or organizations considered to be the “authors” of the
project. The exact meaning is open to interpretation — it may list the
original or primary authors, current maintainers, or owners of the
package.

 The “maintainers” key is similar to “authors” in that its exact
meaning is open to interpretation.

 These keys accept an array of tables with 2 keys: ` name ` and
` email `. Both values must be strings. The ` name ` value MUST be a
valid email name (i.e. whatever can be put as a name, before an email,
in [RFC 822](https://datatracker.ietf.org/doc/html/rfc822.html)) and not contain commas. The ` email ` value MUST be a
valid email address. Both keys are optional, but at least one of the
keys must be specified in the table.

 Using the data to fill in [core metadata](../core-metadata/#core-metadata) is as
follows:



- If only ` name ` is provided, the value goes in
[Author](../core-metadata/#core-metadata-author) or
[Maintainer](../core-metadata/#core-metadata-maintainer) as appropriate.

- If only ` email ` is provided, the value goes in
[Author-email](../core-metadata/#core-metadata-author-email) or
[Maintainer-email](../core-metadata/#core-metadata-maintainer-email)
as appropriate.

- If both ` email ` and ` name ` are provided, the value goes in
[Author-email](../core-metadata/#core-metadata-author-email) or
[Maintainer-email](../core-metadata/#core-metadata-maintainer-email)
as appropriate, with the format ` {name} `.

- Multiple values should be separated by commas.




### ` keywords `[¶](#keywords)



- [TOML](https://toml.io) type: array of strings

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Keywords](../core-metadata/#core-metadata-keywords)

 The keywords for the project.




### ` classifiers `[¶](#classifiers)



- [TOML](https://toml.io) type: array of strings

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Classifier](../core-metadata/#core-metadata-classifier)

 Trove classifiers which apply to the project.

 The use of ` License :: ` classifiers is deprecated and tools MAY issue a
warning informing users about that.
Build tools MAY raise an error if both the ` license ` string value
(translating to ` License-Expression ` metadata field) and the ` License :: `
classifiers are used.




### ` urls `[¶](#urls)



- [TOML](https://toml.io) type: table with keys and values of strings

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Project-URL](../core-metadata/#core-metadata-project-url)

 A table of URLs where the key is the URL label and the value is the
URL itself. See [Well-known Project URLs in Metadata](../well-known-project-urls/#well-known-project-urls) for normalization rules
and well-known rules when processing metadata for presentation.




### Entry points[¶](#entry-points)



- [TOML](https://toml.io) type: table (` [project.scripts] `, ` [project.gui-scripts] `,
and ` [project.entry-points] `)

- [Entry points specification](../entry-points/#entry-points)

 There are three tables related to entry points. The
` [project.scripts] ` table corresponds to the ` console_scripts `
group in the [entry points specification](../entry-points/#entry-points). The key
of the table is the name of the entry point and the value is the
object reference.

 The ` [project.gui-scripts] ` table corresponds to the ` gui_scripts `
group in the [entry points specification](../entry-points/#entry-points). Its
format is the same as ` [project.scripts] `.

 The ` [project.entry-points] ` table is a collection of tables. Each
sub-table’s name is an entry point group. The key and value semantics
are the same as ` [project.scripts] `. Users MUST NOT create
nested sub-tables but instead keep the entry point groups to only one
level deep.

 Build back-ends MUST raise an error if the metadata defines a
` [project.entry-points.console_scripts] ` or
` [project.entry-points.gui_scripts] ` table, as they would
be ambiguous in the face of ` [project.scripts] ` and
` [project.gui-scripts] `, respectively.




### ` dependencies `[¶](#dependencies)



- [TOML](https://toml.io) type: Array of [dependency specifier](../dependency-specifiers/#dependency-specifiers)
strings (` dependencies `)

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Requires-Dist](../core-metadata/#core-metadata-requires-dist)

 ` dependencies ` lists the expected dependencies of the project as an
array of strings.

 Each string represents a dependency of the project and MUST be
formatted as a valid [dependency specifier](../dependency-specifiers/#dependency-specifiers).

 Each string maps directly to a
[Requires-Dist](../core-metadata/#core-metadata-requires-dist) entry.

 Dependencies listed in this array are always considered
for installation, but may still contain environment markers that cause them
to be skipped in some environments.




### ` optional-dependencies `[¶](#optional-dependencies)



- [TOML](https://toml.io) type: table with string keys mapping to arrays of
[dependency specifier](../dependency-specifiers/#dependency-specifiers) strings (` optional-dependencies `)

- Corresponding [core metadata](../core-metadata/#core-metadata) fields:
[Requires-Dist](../core-metadata/#core-metadata-requires-dist) and
[Provides-Extra](../core-metadata/#core-metadata-provides-extra)

 ` optional-dependencies ` is a table where each key specifies
an extra and whose value is an array of strings using the same format as the
` dependencies ` array (the strings in the
arrays must be valid [dependency specifiers](../dependency-specifiers/#dependency-specifiers)).

 The keys MUST be valid values
for [Provides-Extra](../core-metadata/#core-metadata-provides-extra). Each value
in the array thus becomes a corresponding
[Requires-Dist](../core-metadata/#core-metadata-requires-dist) entry for the
matching [Provides-Extra](../core-metadata/#core-metadata-provides-extra)
metadata.

 The optionality of these dependencies is recorded by modifying the environment
marker clause on the related ` Requires-Dist ` entries to check the extra name.
Optional dependencies are thus only considered for installation if installation
if the associated extra name is requested.

 Dependency specifiers in an extra may self-reference other extras from the
current project (e.g. ` all = ["your-project-name[gui, cli]"] `). See
[self-referential extras](../../guides/writing-pyproject-toml/#self-referential-extras) for an example.
Most package managers now support this kind of extra, including
[pip](../../key_projects/#pip), [uv](../../key_projects/#uv), [poetry](../../key_projects/#poetry), [hatch](../../key_projects/#hatch), [pdm](../../key_projects/#pdm) and [Pipenv](../../key_projects/#pipenv).




### ` import-names `[¶](#import-names)



- [TOML](https://toml.io) type: array of strings

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Import-Name](../core-metadata/#core-metadata-import-name)

 An array of strings specifying the import names that the project exclusively
provides when installed. Each string MUST be a valid Python identifier or can
be empty. An import name MAY be followed by a semicolon and the term “private”
(e.g. ` "; private" `) with any amount of whitespace surrounding the semicolon.

 Projects SHOULD list all the shortest import names that are exclusively provided
by the project. If any of the shortest names are dotted names, all intervening
names from that name to the top-level name should also be listed appropriately
in ` import-names ` and/or ` import-namespaces `. For instance, a project which
is a single package named spam with multiple submodules would only list
` project.import-names = ["spam"] `. A project that lists ` spam.bacon.eggs `
would also need to account for ` spam ` and ` spam.bacon ` appropriately in
` import-names ` and ` import-namespaces `. Listing all names acts as a check
that the intent of the import names is as expected. As well, projects SHOULD
list all import names, public or private, using the ` ; private ` modifier as
appropriate.

 If a project lists the same name in both ` import-names ` and
` import-namespaces `, then tools MUST raise an error due to ambiguity.

 Projects MAY set ` import-names ` to an empty array to represent a project with
no import names (i.e. there are no Python modules of any kind in the
distribution file).

 Build back-ends MAY support dynamically calculating the value if the user
declares the key in ` project.dynamic `.

 Examples:

 [project]
 name = "pillow"
 import-names = [ "PIL" ]


 [project]
 name = "myproject"
 import-names = [ "mypackage" , "_private_module ; private" ]





### ` import-namespaces `[¶](#import-namespaces)



- [TOML](https://toml.io) type: array of strings

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Import-Namespace](../core-metadata/#core-metadata-import-namespace)

 An array of strings specifying the import names that the project provides when
installed, but not exclusively. Each string MUST be a valid Python identifier.
An import name MAY be followed by a semicolon and the term “private” (e.g.
` "; private" `) with any amount of whitespace surrounding the semicolon. Note
that unlike ` import-names `, ` import-namespaces ` CANNOT be an empty array.

 Projects SHOULD list all the shortest import names that are exclusively provided
by the project. If any of the shortest names are dotted names, all intervening
names from that name to the top-level name should also be listed appropriately
in ` import-names ` and/or ` import-namespaces `.

 This field is used for namespace packages where multiple projects can contribute
to the same import namespace. Projects all listing the same import name in
` import-namespaces ` can be installed together without shadowing each other.

 If a project lists the same name in both ` import-names ` and
` import-namespaces `, then tools MUST raise an error due to ambiguity.

 Build back-ends MAY support dynamically calculating the value if the user
declares the key in ` project.dynamic `.

 Example:

 [project]
 name = "zope-interface"
 import-namespaces = [ "zope" ]
 import-names = [ "zope.interface" ]





### ` dynamic `[¶](#dynamic)



- [TOML](https://toml.io) type: array of string

- Corresponding [core metadata](../core-metadata/#core-metadata) field:
[Dynamic](../core-metadata/#core-metadata-dynamic)

 Specifies which keys listed by this PEP were intentionally
unspecified so another tool can/will provide such metadata
dynamically. This clearly delineates which metadata is purposefully
unspecified and expected to stay unspecified compared to being
provided via tooling later on.



- A build back-end MUST honour statically-specified metadata (which
means the metadata did not list the key in ` dynamic `).

- A build back-end MUST raise an error if the metadata specifies
` name ` in ` dynamic `.

- If the [core metadata](../core-metadata/#core-metadata) specification lists a
field as “Required”, then the metadata MUST specify the key
statically or list it in ` dynamic ` (build back-ends MUST raise an
error otherwise, i.e. it should not be possible for a required key
to not be listed somehow in the ` [project] ` table).

- If the [core metadata](../core-metadata/#core-metadata) specification lists a
field as “Optional”, the metadata MAY list it in ` dynamic ` if the
expectation is a build back-end will provide the data for the key
later.

- Build back-ends MUST raise an error if the metadata specifies a key
statically as well as being listed in ` dynamic `, *unless* the key
represents a list or arbitrary table that can be extended, listed below.

- If the metadata does not list a key in ` dynamic `, then a build
back-end CANNOT fill in the requisite metadata on behalf of the user
(i.e. ` dynamic ` is the only way to allow a tool to fill in
metadata and the user must opt into the filling in).

- Build back-ends MUST raise an error if the metadata specifies a
key in ` dynamic ` but the build back-end was unable to determine
the data for it (omitting the data, if determined to be the accurate
value, is acceptable).

 A key whose value is a list or a table of arbitrary entries MAY be
specified statically and listed in ` dynamic ` simultaneously. The
keys fitting that description are:



- ` authors `

- ` classifiers `

- ` dependencies `

- ` entry-points `

- ` gui-scripts `

- ` import-names `

- ` import-namespaces `

- ` keywords `

- ` license-files `

- ` maintainers `

- ` optional-dependencies `

- ` scripts `

- ` urls `

 When such a key is specified both statically and listed in
` dynamic `:



- A build back-end MAY only *append* entries to the value; it MUST NOT
remove, reorder, or modify any statically-specified entries. For
tables (such as ` optional-dependencies ` or ` entry-points `) this
means a back-end MAY add new keys and MAY append to the values of
existing keys (in the case of a list), but MUST NOT change or remove the
entries given statically.

- A build back-end SHOULD raise an error if a key is listed in
` dynamic ` and it does not support extending that key.




## Arbitrary tool configuration: the ` [tool] ` table[¶](#arbitrary-tool-configuration-the-tool-table)

 The ` [tool] ` table is where any tool related to your Python
project, not just build tools, can have users specify configuration
data as long as they use a sub-table within ` [tool] `, e.g. the
[flit](https://pypi.python.org/pypi/flit) tool would store its
configuration in ` [tool.flit] `.

 A mechanism is needed to allocate names within the ` tool.* `
namespace, to make sure that different projects do not attempt to use
the same sub-table and collide. Our rule is that a project can use
the subtable ` tool.$NAME ` if, and only if, they own the entry for
` $NAME ` in the Cheeseshop/PyPI.



## History[¶](#history)



- May 2016: The initial specification of the ` pyproject.toml ` file, with just
a ` [build-system] ` containing a ` requires ` key and a ` [tool] ` table, was
approved through [PEP 518](https://peps.python.org/pep-0518/).

- November 2020: The specification of the ` [project] ` table was approved
through [PEP 621](https://peps.python.org/pep-0621/).

- December 2024: The ` license ` key was redefined, the ` license-files ` key was
added and ` License:: ` classifiers were deprecated through [PEP 639](https://peps.python.org/pep-0639/).

- September 2025: Clarity that the ` license ` key applies to all distribution
files generated from the ` pyproject.toml ` file.

- October 2025: The ` import-names ` and ` import-namespaces ` keys were added
through [PEP 794](https://peps.python.org/pep-0794/).

- January 2026: Replaced outdated direct reference to [PEP 508](https://peps.python.org/pep-0508/) with a
reference to [Dependency specifiers](../dependency-specifiers/#dependency-specifiers).

- May 2026: Allowed list and table keys to be specified statically as well
as listed in ` dynamic `, with build back-ends only able to append
entries, through [PEP 808](https://peps.python.org/pep-0808/).

- August 2026: Document self-referential extra as a supported feature by many
modern package managers of Python.
