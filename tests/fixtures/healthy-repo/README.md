# Healthy repository fixture

This directory documents the minimal healthy-repository shape used by GitSkillPro acceptance tests. Tests create disposable Git repositories at runtime rather than mutating this fixture in place.

A healthy baseline has a resolvable repository root, a committed HEAD, known Git version, and no unexplained work. Individual tests deliberately introduce dirty or detached state to prove the auditor reports risk without modifying it.
