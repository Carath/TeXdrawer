# Symbols directory

This directory's purpose is to store files necessary for TeXdrawer to run. At the present time, it contains:

- latex2unicode.csv
- mappings/
- services/


#### latex2unicode.csv

The ``` latex2unicode.csv ``` file contains a table, whose rows are one LaTeX command with a possible unicode for the symbol said command represents. The separator is the tab ``` \t ``` character. Note that alike latex commands, different unicodes can point to the exact same symbol. For example, the ``` - ``` character could be given the following unicodes:

```
U+2D => "hyphen-minus"
U+2212 => "minus sign"
```

In such contentious cases, an unicode has been chosen (somewhat arbitrarily). Furthermore, the ``` latex2unicode.csv ``` file may contain several latex commands pointing to the same unicode, for example:

```
[ => U+5B
\lbrack => U+5B
```

An useful link to search or visualize unicode characters is the following: <https://www.compart.com/en/unicode/>


#### mappings/

Some symbols defined by LaTeX commands look exactly the same, for example ``` \sum ``` and ``` \Sigma ```. Others, like ``` 0 ``` and ``` O ```, look very similar. As demonstrated by the benchmarks, this can greatly hinder the classification capabilities of a given service. For that reason, a mapping mechanism has been implemented, in order to regroup such symbols in chosen equivalence classes. Note that such mappings are service agnostic (i.e the symbols they contain may be not be supported by a particular service), and completely optional: the ``` none ``` mapping name is reserved, and corresponds to the case where the canonical projection map is the identity.

Mappings files are saved in their own directory, and must be in ``` json ``` format. As of now, only two non trivial mappings are defined: ``` strict-0 ``` and ``` similar-0 ```. The first correspond to a *strict* mapping, in that only identical symbols are regrouped, while the second regroups symbols which only look similar. In the future, other mappings could be created, for example by regrouping symbols similar up to a rotation.

It is worth mentioning that retrieving the correct LaTeX command of a given symbol may not be possible in an of itself, without having some context surrounding it (e.g an equation for ``` \sum ```, or a text written in greek for ``` \Sigma ```). When such a context is known, a disambiguation task may need to be done, by searching among the found equivalence class which symbol is more likely to fit.


#### services/

This directory contains text files, one per supported classification services (for now, only ``` hwrt ``` and ``` detexify ```). Each of those files must have a filename matching its service name, and contain the list of symbols supported by said service.

Note about ``` hwrt ```: some uppercase letters from the greek alphabet are not present, for their are identical to letters from the latin alphabet. This is also the case for ``` \upsilon ``` (similar to ``` v ```), and ``` \omicron ``` (which does not exist, similar to ``` o ```). Furthermore, a previous version of hwrt supported only 369 symbols, the currently used version removed the symbol ``` \dotsc ``` (probably deemed too similar to ``` \dots ```), and added to following ones:

```
!
(
)
=
\MVAt
\Smiley
\frac{}{}
\pentagram
t
```
