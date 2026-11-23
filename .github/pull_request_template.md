## Objectif

Décrire le besoin utilisateur et le résultat observable.

## Changements

-

## Documentation

- [ ] La fiche canonique sous `docs/features/` est créée ou mise à jour.
- [ ] Le catalogue `docs/features/README.md` référence toute nouvelle fonctionnalité.
- [ ] Un ADR est ajouté si la décision est coûteuse à inverser.
- [ ] Les contrats API, migrations, permissions et cas limites sont documentés.

## Sécurité et données

- [ ] Les entrées sont validées côté serveur.
- [ ] Les autorisations sont vérifiées sur chaque route affectée.
- [ ] Aucun secret ou contenu personnel sensible n’apparaît dans les logs/diffs.
- [ ] Le scan interne et Gitleaks passent sans exception ni allowlist nouvelle.
- [ ] Les nouvelles dépendances et le lockfile ont été revus.

## Vérification

- [ ] `pnpm run quality:prepush` réussit sans skip.
- [ ] Les cas adverses et invariants métier modifiés ont des tests qui auraient
  échoué avant ce changement (pas seulement le happy path).
- [ ] Une revue fraîche correctness/architecture/security/performance ne laisse
  aucun finding bloquant.
- [ ] Les preuves ou captures utiles sont jointes.
- [ ] Le plan de migration et de rollback est indiqué si nécessaire.
- [ ] Pour une release: container-build, protection GitHub, backup/restore,
  rollback et post-deploy smoke ont une preuve sur le commit exact.
- [ ] Pour une release: `release:github-secrets`, `release:github-label` et
  `release:github-protection` passent sur la configuration distante.
- [ ] Toutes les actions GitHub externes sont épinglées à un SHA immuable.
