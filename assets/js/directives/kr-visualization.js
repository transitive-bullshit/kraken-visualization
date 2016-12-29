angular.module('kraken').directive('krVisualization', function ($window, $timeout, krUtils, krDatGui) {
  var diam = 48
  var radius = diam / 2

  return {
    restrict: 'A',
    link: function ($scope, $element) {
      var r0 = d3.scale.linear().range([ radius, diam * 1.5 ]).domain([ 0.5, 0.8 ])

      var postReputationBubbleRadius = function (x) {
        if (x < 0.5) {
          return 0
        } else if (x < 0.8) {
          return r0(x)
        } else {
          return r0(0.8)
        }
      }

      var reputationBubbleRadius = d3.scale.linear().range([ radius, diam * 1.5 ]).domain([ 0, 1 ])
      $element.addClass("fit")

      d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
          this.parentNode.appendChild(this)
        })
      }

      d3.selection.prototype.moveToBack = function () {
        return this.each(function () {
          var firstChild = this.parentNode.firstChild
          if (firstChild) {
            this.parentNode.insertBefore(this, firstChild)
          }
        })
      }

      var svg = d3.select($element[0])
        .append("svg")
          .attr("width",  "100%")
          .attr("height", "100%")

      var defs = svg.append("defs")

      defs.append("clipPath")
        .attr("id", "circle-clip")
        .attr("clipPathUnits", "objectBoundingBox")
        .append("svg:circle")
          .attr("cx", 0.5)
          .attr("cy", 0.5)
          .attr("r",  0.5)

      {
        var gradient = defs.append("radialGradient")
          .attr("id", "reputation-bubble-fill")

        gradient.append("stop")
          .attr({
            "offset": "0%",
            "stop-color": "rgba(168, 201, 241, 1.0)"
          })

        gradient.append("stop")
          .attr({
            "offset": "100%",
            "stop-color": "rgba(168, 201, 241, 0.0)"
          })
      }

      var nodeD = svg.selectAll(".element")
      var nodes = []
      var nodeI

      var organizationMap = {}
      var connectionMap = {}
      var organizations = []
      var candidates = []
      var connections = []

      var midpoint = { x: $element.width() / 2, y: $element.height() / 2, offset: 0 }
      var selection = null
      var simulationIteration = -1
      var dashOffset = 1000
      var animateDash = false

      var connectionsD = svg.selectAll(".element-link")

      var line = d3.svg.line()
        .x(function (d) { return d.x + d.offset })
        .y(function (d) { return d.y + radius })
        .interpolate("basis")

      var stats = new Stats()
      stats.setMode(0) // 0: fps, 1: ms

      stats.domElement.style.position = 'absolute'
      stats.domElement.style.left = '0px'
      stats.domElement.style.top  = '0px'
      document.body.appendChild(stats.domElement)

      var drawConnections = false
      var forceTimeout = null

      // stop physics simulation after giving it a chance to settle
      $timeout(function () {
        drawConnections = true
        connectionsD.classed("element-link-enter", false)
        //stopForce()
      }, 5000)

      var forceActive = true

      function frame () {
        stats.begin()

        if (simulationIteration >= 1) {
          //console.log('dash', dashOffset, dashOffset + (!!(simulationIteration & 1) ? 5 : -5))
          dashOffset += (!!(simulationIteration & 1) ? 5 : -5)
          //dashOffset = (dashOffset + 1) % 10
        }

        if (drawConnections) {
          /*connectionsD
            .attr("stroke-dasharray", function (d) { return d[0].dashArray() || d[2].dashArray() })
            .attr("stroke-dashoffset", function (d) { return d[0].dashOffset() || d[2].dashOffset() })*/
            /*.style("stroke-width", function (d) {
              if (simulationIteration >= 1 && animateDash) {
                var weight = dashOffset * d[0].reputation(simulationIteration)
                console.log(weight)
                return dashOffset * d[2].reputationAnimation(simulationIteration)
              } else {
                return null
              }
            })*/
        }

        svg.selectAll('.reputation-bubble')
          .attr("cx", function (d) { return d.element.x + radius })
          .attr("cy", function (d) { return d.element.y + radius })

        if (simulationIteration < 0 && !forceActive) {
          window.requestAnimationFrame(frame)
        }

        stats.end()
      }

      function stopForce () {
        forceTimeout = null
        forceActive  = false
        force.stop()
        window.requestAnimationFrame(frame)
      }

      function tick (e) {
        var k = 0.6 * e.alpha
        var w = $element.width()
        var h = $element.height()
        var dd = 0

        // Push nodes toward their designated focus
        nodes.forEach(function (o) {
          o.x = Math.max(radius, Math.min(o.x, w - diam))
          o.y = Math.max(radius, Math.min(o.y, h - diam))

          var dx = (o.focus.x * w - o.x) * k
          // var dy = (o.focus.y * h - o.y) * k

          dd  += dx * dx
          o.x += dx
        })

        /*var q = d3.geom.quadtree(nodes),
            i = 0,
            n = nodes.length;

        while (++i < n) {
          q.visit(collide(nodes[i]));
        }*/

        nodeD.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
        connectionsD.attr("d", function (d) { return line(d) })

        dd = Math.sqrt(dd)
        if (drawConnections && dd <= 16 && simulationIteration < 0) {
          stopForce()
        }

        if (drawConnections && !forceTimeout && simulationIteration < 0) {
          forceTimeout = $timeout(stopForce, 5000)
        }

        frame()
      }

      /*function collide (node) {
        var r = radius + 16,
            nx1 = node.x - r,
            nx2 = node.x + r,
            ny1 = node.y - r,
            ny2 = node.y + r;

        return function (quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== node)) {
            var x = node.x - quad.point.x,
                y = node.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = radius + quad.point.radius;
            if (l < r) {
              l = (l - r) / l * 0.5;
              node.x -= x *= l;
              node.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        };
      }*/

      function getFocalPoint (x) {
        return { x: x, y: krUtils.Random.sample(0.3, 0.7) }
      }

      function selectNode (d) {
        var sel = "." + d.type + "-" + d.slug

        d3.selectAll(sel)
          .classed("active", true)
          //.moveToFront()

        //d3.select("g" + sel)
        //  .classed('selected', !!selected)

      }

      function deselectNode () {
        d3.selectAll(".active")
          .classed("active", false)
          //.moveToBack()
        //d3.select(".selected")
        //  .classed("selected", false)
      }

      $scope.$on('select:node', function (event, node) {
        selection = node
        selectNode(node, true)
      })

      $scope.$on('deselect:node', function (event, node) {
        selection = null
        deselectNode(node)
      })

      var force = d3.layout.force()
        .links([])
        .size([ 1024, 768 ])
        .gravity(1.0)
        .charge(-3000)
        //.chargeDistance(500)
        .theta(0.9999)
        .on("tick", tick)

      function _reset () {
        var c = $scope.candidates || []
        var o = $scope.organizations || []

        organizationMap = {}
        connectionMap = {}

        organizations = []
        candidates = []
        connections = []
        nodes = []

        var w = $element.width()
        var h = $element.height()

        console.log('dimensions', w, h)

        var yScale = d3.scale.linear()
          .range([ 0.0, 1.0 ])
          .domain([ 0.3, 0.7 ])

        // preprocess candidates
        c.forEach(function (candidate) {
          candidate = _.extend({
            focus: getFocalPoint(0.0),
            slug: candidate.name.toLowerCase().replace(" ", "-").replace(/[^a-zA-Z0-9]/g, ""),
            type: 'candidate',
            class: 'element candidate',
            offset: diam - radius / 3
          }, candidate)

          candidate.class += " candidate-" + candidate.slug
          candidate.x = (candidate.focus.x + krUtils.Random.sample(-0.1, 0.1)) * w
          candidate.y = yScale(candidate.focus.y) * h
          //console.log("can", candidate.x, candidate.y)

          candidates.push(candidate)
          nodes.push(candidate)
        })

        // preprocess organizations
        o.forEach(function (organization) {
          organization = _.extend({
            focus: getFocalPoint(1.0),
            type: 'organization',
            class: 'element organization',
            offset: radius / 3
          }, organization)

          organization.class += " organization-" + organization.slug
          organization.x = (organization.focus.x + krUtils.Random.sample(-0.1, 0.1)) * w
          organization.y = yScale(organization.focus.y) * h
          //console.log("org", organization.x, organization.y)

          organizationMap[organization.slug] = organization
          organizations.push(organization)
          nodes.push(organization)
        })

        nodes.forEach(function (n) {
          connectionMap[n.slug] = []

          n.dashOffset = function () {
            if (simulationIteration >= 1) {
              return "" + dashOffset
            } else {
              return null
            }
          }

          n.dashArray = function () {
            if (simulationIteration >= 1) {
              if (simulationIteration >= n.firstIteration) {
                return "10 10"
              }
            }

            return null
          }
        })

        // preprocess candidate-organization connections
        candidates.forEach(function (candidate) {
          candidate.organizations.forEach(function (job) {
            var organization = organizationMap[job.slug]

            if (organization) {
              candidate.class    += " organization-" + organization.slug
              organization.class += " candidate-" + candidate.slug

              connections.push([ candidate, midpoint, organization ])

              connectionMap[candidate.slug].push(organization)
              connectionMap[organization.slug].push(candidate)
            }
          })
        })

        connectionsD = connectionsD.data(connections)

        connectionsD.enter().append("svg:path")
          .moveToBack()
          .attr("class", function (d, i) {
            var c = "element-link element-link-enter candidate-" + d[0].slug + " organization-" + d[2].slug

            if ((i % 5) !== 0) {
              c += " element-link-hidden"
            }

            return c
          })
          /*.on("mouseover", function (d) {
            if (selection) return
            d3.selectAll("." + d[0].type + "-" + d[0].slug)
              .classed('active', true)
              //.moveToFront()
          })
          .on("mouseout", function (d) {
            if (selection) return
            d3.selectAll("." + d[0].type + "-" + d[0].slug)
              .classed('active', false)
              //.moveToBack()
          })*/

        connectionsD.exit().remove()

        nodeD = nodeD.data(nodes)

        var nodeDE = nodeD.enter().append("g")
          .attr("class", function (d) { return d.class })
          .call(force.drag)
          .attr('transform', function (d) { return 'translate(' + d.focus.x + ',' + d.focus.y + ')' })

        nodeDE.append("circle")
          .style("fill", "#000")
          .attr("cx", radius)
          .attr("cy", radius)
          .attr("r",  radius - 2)

        // candidate profile image or organization logo depending on node type
        nodeI = nodeDE.append("image")
          .attr("clip-path", "url(#circle-clip)")
          .attr("width",  diam)
          .attr("height", diam)
          .attr("xlink:href", function (d) { return d.image || d.logo })

        // hover overlay
        nodeDE.append("circle")
          .attr("class", "overlay")
          .attr("cx", radius)
          .attr("cy", radius)
          .attr("r",  radius)
          .on("click", function (d) {
            if (d3.event.defaultPrevented) return

            if (d.type === 'candidate') {
              $scope.onSelectCandidate(d)
            } else {
              $scope.onSelectOrganization(d)
            }
          })
          .on("mouseover", function (d) {
            if (selection) return
            selectNode(d, false)
          })
          .on("mouseout", function (d) {
            if (selection) return
            deselectNode(d)
          })

        nodeD.exit().remove()

        force.nodes(nodes).start()
      }

      function resize () {
        var w = $element.width()
        var h = $element.height()

        if (!w || !h) return $timeout(resize)
        midpoint.x = w / 2
        midpoint.y = h / 2
        force.size([ w, h ]).resume()
      }

      angular.element($window).bind('resize', resize)
      $scope.$on("$destroy", function() {
        angular.element($window).unbind('resize', resize)
      })

      // respond to changes in reputation priority
      $scope.$watch('reputation.priority', function (priority) {
        console.log('priority', priority)

        $scope.$emit('animation', !!priority)

        var reputationBubbles = []
        var numIterations = 8

        function getActive (elements) {
          return _.filter(elements, function (c) { return c.firstIteration >= 0 })
        }

        function setActive (element) {
          connectionMap[element.slug].forEach(function (adjacent) {
            if (adjacent.firstIteration < 0) {
              adjacent.firstIteration = iteration
            }
          })
        }

        svg.selectAll('.reputation-bubble')
          .remove()

        if (nodeI) nodeI.style("opacity", 1.0)

        if (!!priority) {
          organizations.forEach(function (organization) {
            var scores = organization.scores[priority]
            organization.firstIteration = (scores[0] > 0 ? 0 : -1)
            //console.log(organization.slug, organization.firstIteration, scores)
          })

          candidates.forEach(function (candidate) {
            candidate.firstIteration = -1
          })

          for (var iteration = 0; iteration < numIterations; ++iteration) {
            var isEven = !(iteration & 1)

            getActive(isEven ? candidates : organizations).forEach(setActive)
          }

          nodes.forEach(function (node) {
            var scores = node.scores[priority]
            var reputation = d3.scale.linear()
              .range([ scores[0], scores[1] ])
              .domain([ node.firstIteration, numIterations ])

            //console.log(node.slug, node.firstIteration)
            var bubble = {
              element: node,
              reputation: function (iteration) {
                var isEven = !(iteration & 1)
                //console.log(node.type, iteration, isEven)

                if (iteration < node.firstIteration || node.firstIteration < 0) {
                  return 0
                } else {
                  if (isEven === (node.type !== 'candidate') || iteration >= numIterations - 1) {
                    return reputation(iteration)
                  } else {
                    return 0
                  }
                }
              },

              reputationAnimation: function (iteration) {
                if (iteration < node.firstIteration || node.firstIteration < 0) {
                  return 0
                } else {
                  return reputation(iteration)
                }
              }
            }

            node.reputation = bubble.reputation
            node.reputationAnimation = bubble.reputationAnimation

            reputationBubbles.push(bubble)
          })
        } else {
          return
        }

        var bubblesD = svg.selectAll('.reputation-bubble')
          .data(reputationBubbles)
          .enter().append("circle")
            .attr("class", "reputation-bubble")
            .attr("cx", function (d) { return d.element.x + radius })
            .attr("cy", function (d) { return d.element.y + radius })
            .attr("r", reputationBubbleRadius(0))
            .moveToBack()

        simulationIteration = 0
        var opacityScale = d3.scale.linear().range([ 0.5, 1.0 ]).domain([ 0, 1 ])

        function loop () {
          console.log("animation loop", simulationIteration)
          //force.resume()
          animateDash = true

          connectionsD
            .classed("transfer", function (d) {
                return (simulationIteration > 0 && (simulationIteration >= d[0].firstIteration || simulationIteration >= d[2].firstIteration))
            })

          nodeI
            .transition()
            .duration(1200)
            .style("opacity", function (d) {
              return opacityScale(d.reputationAnimation(simulationIteration))
            })

          bubblesD
            .transition()
            .duration(1200)
            /*.each("start", function (d) {
              if (simulationIteration > 0 && simulationIteration >= d.element.firstIteration) {
                d3.selectAll("." + d.element.type + "-" + d.element.slug + ".element-link")
                  .style("stroke-width", 5 * d.reputationAnimation(simulationIteration))
                  .classed("transfer", true)
              } else {
                d3.selectAll("." + d.element.type + "-" + d.element.slug + ".element-link")
                  .style("stroke-width", null)
                  .classed("transfer", false)
              }
            })*/
            /*.each("start", function (d) {
              if (simulationIteration > 0 && simulationIteration >= d.element.firstIteration) {
                d3.selectAll("." + d.element.type + "-" + d.element.slug + ".element-link")
                  .style("stroke-width", 5 * d.reputation(simulationIteration))
                  .classed("transfer", true)
              }
            })*/
            .attr("r",  function (d) {
              var reputation = d.reputation(simulationIteration)
              if (simulationIteration >= numIterations - 1) {
                return postReputationBubbleRadius(reputation)
              } else {
                return reputationBubbleRadius(reputation)
              }
            })
            .each("end", function (d, i) {
              if (i !== 0) return

              if (simulationIteration >= numIterations - 1) {
                d3.selectAll(".element-link")
                  .style("stroke-width", null)
                  .classed("transfer", false)

                stopForce()
                simulationIteration = -1
                $scope.$emit('animation', false)
              } else {
                animateDash = false

                bubblesD
                  .transition()
                  .duration(1200)
                  .attr("r",  function () { return reputationBubbleRadius(0) })
                  .each("end", function (d, i) {
                    if (i !== 0) return

                    ++simulationIteration
                    $timeout(loop)
                  })
              }
            })
            /*.each("end", function (d) {
              d3.selectAll("." + d.element.type + "-" + d.element.slug + ".element-link")
                .style("stroke-width", null)
                .classed("transfer", false)

              if (!ended) {
                ended = true

                if (++simulationIteration < numIterations) {
                  $timeout(loop)
                } else {
                  // simulation has finished
                  simulationIteration = -1
                  $scope.$emit('animation', false)
                }
              }
            })*/
        }

        loop()
      })

      var reset = _.debounce(_reset, 100)
      $scope.$watch('candidates', reset)
      $scope.$watch('organizations', reset)

      resize()
      $timeout(resize, 2000)

      /*
      krDatGui.get()
      krDatGui.addChangeListener(function (data) {
        // TODO: dynamic styling needs work
        //d3.selectAll('.element-link')
        //  .style('stroke-width', data['link-width'])
        //  .style('stroke', "rgba(127, 127, 127, " + data['link-alpha'] + ")")

        force
          .gravity(data.gravity)
          .charge(data.charge)
          .start()

        d3.selectAll('.element-link')
          .classed("element-link-hidden", function (d, i) {
            return ((i % data.linkSparsity) !== 0)
          })

        //$scope.$emit('dat.gui', data)
      })
      */
    }
  }
});
